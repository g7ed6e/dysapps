// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { Subject } from '../apps/registry';
import type { ProgrammeId } from '../programme';
import type { AnyIconName } from '../components/Icon';
import { lv2Courante, type Lv2Choice } from '../core/settings';

/** Une deuxième langue vivante (pas « Pas de LV2 »). */
export type Lv2 = Exclude<Lv2Choice, 'aucune'>;

export type BiomeId =
  | 'foret'
  | 'mine'
  | 'carriere'
  | 'ferme'
  | 'tour'
  | 'plaine'
  | 'riviere'
  | 'volcan'
  | 'glacier'
  | 'marche'
  | 'carrefour'
  | 'marais'
  | 'forge'
  | 'atelier'
  | 'falaise'
  | 'cabinet'
  | 'belvedere'
  | 'donnees'
  | 'phare'
  | 'textes'
  | 'baie'
  | 'horloge'
  | 'comptoir'
  | 'manoir'
  | 'theatre'
  | 'gare'
  | 'studio'
  | 'chateau'
  | 'relais';
export type BlockId =
  | 'bois'
  | 'pierre'
  | 'sable'
  | 'terre'
  | 'verre'
  | 'brique'
  | 'galet'
  | 'obsidienne'
  | 'glace'
  | 'toile'
  | 'panneau'
  | 'tourbe'
  | 'acier'
  | 'calque'
  | 'ardoise'
  | 'parchemin'
  | 'marbre'
  | 'quartz'
  | 'prisme'
  | 'lentille'
  | 'cabine'
  | 'cadran'
  | 'tuile'
  | 'lambris'
  | 'velours'
  | 'rail'
  | 'antenne'
  | 'taille'
  | 'or'
  | 'cristal'
  | 'dalle'
  | 'toit'
  | 'porte'
  | 'lanterne'
  | 'barriere'
  | 'escalier';

export interface BlockDef {
  id: BlockId;
  name: string;
  /** Face du dessus, face de côté (plus sombre), pour dessiner le cube en SVG. */
  top: string;
  side: string;
  /** Texture pixel du bloc en 3D (voir three/textures.ts). */
  texture: BlockTexture;
  rare?: boolean;
}

export type BlockTexture =
  | 'herbe'
  | 'terre'
  | 'pierre'
  | 'planches'
  | 'sable'
  | 'verre'
  | 'brique'
  | 'galet'
  | 'obsidienne'
  | 'glace'
  | 'toile'
  | 'panneau'
  | 'tourbe'
  | 'acier'
  | 'calque'
  | 'ardoise'
  | 'parchemin'
  | 'marbre'
  | 'quartz'
  | 'prisme'
  | 'lentille'
  | 'cabine'
  | 'cadran'
  | 'tuile'
  | 'lambris'
  | 'velours'
  | 'rail'
  | 'antenne'
  | 'taille'
  | 'or'
  | 'cristal'
  | 'dalle'
  | 'feuilles'
  | 'tronc'
  | 'nuage'
  | 'toit'
  | 'porte'
  | 'lanterne'
  | 'barriere'
  | 'escalier';

export const BLOCKS: Record<BlockId, BlockDef> = {
  bois: { id: 'bois', name: 'Bois', top: '#c29a5f', side: '#9c7a48', texture: 'planches' },
  pierre: { id: 'pierre', name: 'Pierre', top: '#9c9c9c', side: '#7d7d7d', texture: 'pierre' },
  sable: { id: 'sable', name: 'Sable', top: '#e8e0b4', side: '#cfc48f', texture: 'sable' },
  terre: { id: 'terre', name: 'Terre', top: '#94694a', side: '#6e4a2e', texture: 'terre' },
  verre: { id: 'verre', name: 'Verre', top: '#d6f2f8', side: '#a9dbe6', texture: 'verre' },
  brique: { id: 'brique', name: 'Brique', top: '#d98a5a', side: '#b8623a', texture: 'brique' },
  galet: { id: 'galet', name: 'Galet', top: '#a9bccf', side: '#7f96ad', texture: 'galet' },
  obsidienne: { id: 'obsidienne', name: 'Obsidienne', top: '#4a3d5c', side: '#2e2538', texture: 'obsidienne' },
  glace: { id: 'glace', name: 'Glace', top: '#dff4fb', side: '#b6e0ee', texture: 'glace' },
  toile: { id: 'toile', name: 'Toile', top: '#e9d9b8', side: '#c9463f', texture: 'toile' },
  panneau: { id: 'panneau', name: 'Panneau', top: '#f2d16b', side: '#e0b73f', texture: 'panneau' },
  tourbe: { id: 'tourbe', name: 'Tourbe', top: '#5a4a2a', side: '#3f3320', texture: 'tourbe' },
  acier: { id: 'acier', name: 'Acier', top: '#c4ccd4', side: '#8f9aa6', texture: 'acier' },
  calque: { id: 'calque', name: 'Calque', top: '#f4f1e4', side: '#dcd6c0', texture: 'calque' },
  ardoise: { id: 'ardoise', name: 'Ardoise', top: '#5c6470', side: '#3f4650', texture: 'ardoise' },
  parchemin: { id: 'parchemin', name: 'Parchemin', top: '#e8d8a8', side: '#cdb97f', texture: 'parchemin' },
  marbre: { id: 'marbre', name: 'Marbre', top: '#f1eee8', side: '#d6d1c8', texture: 'marbre' },
  quartz: { id: 'quartz', name: 'Quartz', top: '#e6dcf2', side: '#b9a8d6', texture: 'quartz' },
  prisme: { id: 'prisme', name: 'Prisme', top: '#fff4c2', side: '#f0c95a', texture: 'prisme' },
  lentille: { id: 'lentille', name: 'Lentille', top: '#cfe6f2', side: '#7fb2cc', texture: 'lentille' },
  cabine: { id: 'cabine', name: 'Cabine', top: '#d8342c', side: '#b02a24', texture: 'cabine' },
  cadran: { id: 'cadran', name: 'Cadran', top: '#f4ecd6', side: '#c9a24a', texture: 'cadran' },
  tuile: { id: 'tuile', name: 'Tuile', top: '#d97a48', side: '#b85a30', texture: 'tuile' },
  lambris: { id: 'lambris', name: 'Lambris', top: '#6e4a2c', side: '#5a3a22', texture: 'lambris' },
  velours: { id: 'velours', name: 'Velours', top: '#8e2a48', side: '#7a1f3a', texture: 'velours' },
  rail: { id: 'rail', name: 'Rail', top: '#85603a', side: '#4a4a50', texture: 'rail' },
  antenne: { id: 'antenne', name: 'Antenne', top: '#b4bcc4', side: '#9aa4ae', texture: 'antenne' },
  taille: { id: 'taille', name: 'Pierre de taille', top: '#e6dcc4', side: '#d8ccb0', texture: 'taille' },
  or: { id: 'or', name: 'Or', top: '#f2c944', side: '#cfa326', texture: 'or', rare: true },
  cristal: { id: 'cristal', name: 'Cristal', top: '#8ff0e8', side: '#4fc3bb', texture: 'cristal', rare: true },
  // Le bloc du Relais des voyageurs (LV2, 5e) : des dalles de 8 × 8 décalées, distinctes de la pierre de taille par le motif.
  dalle: { id: 'dalle', name: 'Dalle', top: '#b8a07a', side: '#9a8462', texture: 'dalle' },
  // Blocs de finition : ils viennent des coffres des plans (et des coffres de régularité), pas des biomes.
  toit: { id: 'toit', name: 'Toit', top: '#a8443a', side: '#8a3630', texture: 'toit' },
  porte: { id: 'porte', name: 'Porte', top: '#8a6236', side: '#6f4d2a', texture: 'porte' },
  lanterne: { id: 'lanterne', name: 'Lanterne', top: '#ffd85c', side: '#f0b42a', texture: 'lanterne' },
  barriere: { id: 'barriere', name: 'Barrière', top: '#d2b07a', side: '#b8945f', texture: 'barriere' },
  escalier: { id: 'escalier', name: 'Escalier', top: '#c29a5f', side: '#8a6a3c', texture: 'escalier' },
};

/** « de bois », « d’or », « d’escalier » : le nom du bloc avec la bonne élision. */
export function ofBlock(id: BlockId): string {
  const name = BLOCKS[id].name.toLowerCase();
  return /^[aeiouyéèêh]/.test(name) ? `d’${name}` : `de ${name}`;
}

/**
 * Les matières : on les compte en blocs, le nom reste au singulier (« 3 blocs de sable », « 2 blocs d’or ») ; au
 * pluriel, « 3 sables » ou « 2 ors » sont rares, et « 3 verres » ou « 3 glaces » veulent dire autre chose (référent
 * dys). Les autres blocs sont des objets qu’on compte : « 5 toits », « 2 lanternes ».
 */
const MATIERES: ReadonlySet<BlockId> = new Set<BlockId>(
  ['bois', 'pierre', 'sable', 'terre', 'verre', 'obsidienne', 'glace', 'toile', 'tourbe', 'acier', 'marbre', 'quartz', 'velours', 'lambris', 'or'],
);

/** Les pluriels qui ne s’écrivent pas en ajoutant un « s » au nom du bloc. */
const PLURIELS: Partial<Record<BlockId, string>> = { cristal: 'cristaux', panneau: 'panneaux', taille: 'pierres de taille' };

/** Ce qui suit le nombre, accordé : « toit », « toits », « bloc de sable », « blocs d’or », « cristaux ». */
export function blockName(id: BlockId, n: number): string {
  if (MATIERES.has(id)) return `${n > 1 ? 'blocs' : 'bloc'} ${ofBlock(id)}`;
  const name = BLOCKS[id].name.toLowerCase();
  if (n < 2) return name;
  return PLURIELS[id] ?? (/[sxz]$/.test(name) ? name : `${name}s`);
}

/** Une quantité de blocs, accordée : « 5 toits », « 1 lanterne », « 16 blocs de bois ». */
export function blockCount(id: BlockId, n: number): string {
  return `${n} ${blockName(id, n)}`;
}

export interface ExerciseTypeDef {
  id: string;
  title: string;
  description: string;
  /** Compétences du programme officiel que la mission travaille (identifiants de src/programme/). Au moins une. */
  programme: readonly ProgrammeId[];
  /**
   * Une mission de LV2 (île `relais`) : la langue qu'elle travaille. Seules les missions de la LV2 choisie dans les
   * Réglages se jouent ; voir `missionsDe`.
   */
  lv2?: Lv2;
}

export interface CreatureDef {
  name: string;
  /** Ce que dit la créature quand on arrive dans son biome. */
  greeting: string;
  /** Petites phrases quand on la touche dans le village. */
  lines: string[];
  /** Quand sa maison (premier plan de l'île) est terminée. */
  home: string;
}

export type Classe = '6e' | '5e' | '4e' | '3e';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  module: string;
  /** Matière et classe visée (le contenu monte jusqu'à la fin de 3e). */
  subject: Subject;
  classe: Classe;
  description: string;
  block: BlockId;
  icon: AnyIconName;
  /**
   * Le nom du Gardien du biome (boss de fin de biome). Ce qu'il dit pendant le défi et l'espèce de la créature sont des
   * textes d'univers, dans `src/univers/` (lot 6).
   */
  guardian: string;
  creature: CreatureDef;
  exercises: ExerciseTypeDef[];
}

/** Les îles du français (Forêt au centre de l'archipel), puis celles des maths (rangée de devant). */
export const BIOMES: BiomeDef[] = [
  {
    id: 'foret',
    name: 'Forêt des sons',
    module: 'Conscience phonologique',
    subject: 'francais',
    classe: '6e',
    description: 'Écouter, couper en syllabes, repérer les sons et les rimes.',
    block: 'bois',
    guardian: 'le Grand Chêne',
    icon: 'tree',
    creature: {
      name: 'Mousso',
      greeting: 'Salut, bâtisseur ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
      lines: [
        'Tu entends ? Le vent coupe les mots en syllabes.',
        'Ma cabane a besoin de bois. Viens chasser les sons !',
        'Chaque arbre ici a poussé sur une rime.',
      ],
      home: 'J’habite ici maintenant ! Viens voir ma cabane quand tu veux.',
    },
    exercises: [
      { id: 'abattage', title: 'Abattage syllabique', description: 'Tape autant de coups que de syllabes.', programme: ['c3.fr.langue.phonemes-graphemes'] },
      { id: 'chasse-son', title: 'Chasse au son', description: 'Tape les mots où tu entends le son demandé.', programme: ['c3.fr.langue.phonemes-graphemes'] },
      { id: 'rimes', title: 'Rimes-échelle', description: 'Empile les mots qui riment pour monter à la cabane.', programme: ['c3.fr.langue.phonemes-graphemes'] },
    ],
  },
  {
    id: 'mine',
    name: 'Mine des lettres',
    module: 'Confusions de lettres',
    subject: 'francais',
    classe: '6e',
    description: 'b/d, p/q, f/v, ch/j, t/d : ne plus les confondre.',
    block: 'pierre',
    guardian: 'le Golem de roche',
    icon: 'pickaxe',
    creature: {
      name: 'Tunel',
      greeting: 'Bienvenue dans ma mine ! Ici, les lettres se ressemblent, mais mon œil ne se trompe jamais. Pioche les bonnes, je te donne de la pierre.',
      lines: [
        'Un b, un d… regarde bien de quel côté est le ventre.',
        'Ma forge attend sa poutre. Tu as du bois ?',
        'Sous terre, on prend son temps. Moi aussi.',
      ],
      home: 'Ma forge ronfle à nouveau. Écoute : tac, tac, comme des syllabes.',
    },
    exercises: [
      { id: 'filon', title: 'Filon', description: 'Pioche seulement la lettre cible parmi b, d, p, q.', programme: ['c3.fr.langue.phonemes-graphemes'] },
      { id: 'oreille', title: 'Oreille du mineur', description: 'Écoute le mot, choisis le bon bloc : vin ou fin ?', programme: ['c3.fr.langue.phonemes-graphemes'] },
    ],
  },
  {
    id: 'carriere',
    name: 'Carrière des mots',
    module: 'Orthographe lexicale',
    subject: 'francais',
    classe: '6e',
    description: 'Écrire les mots juste, les familles de mots, les mots-outils.',
    block: 'sable',
    guardian: 'la Dune vivante',
    icon: 'mountain',
    creature: {
      name: 'Rouxel',
      greeting: 'Hé, bâtisseur ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt ?',
      lines: [
        'Un mot bien écrit, c’est un bloc qui ne s’effrite pas.',
        'Mon four ! Il me faut du sable et deux pierres.',
        'Le sable, ça vient des mots qu’on a beaucoup lus.',
      ],
      home: 'Le four est chaud ! Tu sens ? Ça sent le pain et les mots bien cuits.',
    },
    exercises: [
      { id: 'mot-troue', title: 'Mot troué', description: 'Glisse le bloc de lettres qui manque.', programme: ['c3.fr.langue.regularites-orthographiques'] },
      { id: 'familles', title: 'Familles-craft', description: 'Assemble préfixe, racine et suffixe.', programme: ['c3.fr.langue.derivation-composition', 'c3.fr.langue.racines', 'c3.fr.langue.familles-champ-lexical'] },
      { id: 'coffre', title: 'Coffre à mots', description: 'Les mots-outils à réviser, en dictée.', programme: ['c3.fr.langue.mots-invariables'] },
    ],
  },
  {
    id: 'ferme',
    name: 'Ferme des accords',
    module: 'Orthographe grammaticale',
    subject: 'francais',
    classe: '6e',
    description: 'Accorder sujet et verbe, choisir a/à, et/est, -é/-er.',
    block: 'terre',
    guardian: 'le Taureau de terre',
    icon: 'wheat',
    creature: {
      name: 'Bloquette',
      greeting: 'Meuh ! À la ferme, tout doit s’accorder. Trie bien les graines et je remplis tes sacs de terre.',
      lines: [
        'Meuh. Les vaches, au pluriel, prennent un s. Comme les murs.',
        'Mon étable, c’est de la terre et quatre poteaux de bois.',
        'Quand tout s’accorde, ça tient debout.',
      ],
      home: 'Meuh ! Mon étable est debout. Je dors au chaud, merci bâtisseur.',
    },
    exercises: [
      { id: 'enclos', title: 'Enclos', description: 'Glisse les sujets vers le bon verbe : singulier ou pluriel.', programme: ['c3.fr.langue.accord-sujet-verbe'] },
      { id: 'graines', title: 'Tri des graines', description: 'Phrases à trous : a/à, et/est, on/ont, son/sont, ce/se.', programme: ['c3.fr.langue.homophonie'] },
      { id: 'recolte', title: 'Récolte -é / -er / -ez', description: 'Clique la bonne terminaison.', programme: ['c3.fr.langue.finales-en-e'] },
    ],
  },
  {
    id: 'tour',
    name: 'Tour du lecteur',
    module: 'Fluence de lecture',
    subject: 'francais',
    classe: '6e',
    description: 'Lire à voix haute, étage par étage.',
    block: 'verre',
    guardian: 'la Chouette de verre',
    icon: 'castle',
    creature: {
      name: 'Grimoire',
      greeting: 'Hou hou. Chaque paragraphe que tu lis construit un étage de ma tour. Prends ton temps, je ne compte pas les secondes à voix haute.',
      lines: ['Hou hou. La nuit, mon phare guide les lecteurs.', 'Du verre pour le phare : lis-moi une page.', 'Lire lentement, c’est lire quand même.'],
      home: 'Hou hou ! Mon phare est allumé. Regarde-le briller ce soir.',
    },
    exercises: [{ id: 'ascension', title: 'Ascension', description: 'Lis un texte court, un paragraphe = un étage.', programme: ['c3.fr.lecture.fluidite'] }],
  },
  {
    id: 'plaine',
    name: 'Plaine des nombres',
    module: 'Calcul et problèmes',
    subject: 'maths',
    classe: '6e',
    description: 'Tables, compléments, doubles et moitiés, puis les problèmes du port, avec des aides visuelles toujours affichées.',
    block: 'brique',
    guardian: 'le Hanneton de bronze',
    icon: 'calculator',
    creature: {
      name: 'Coco',
      greeting:
        'Bonjour, bâtisseur ! Dans ma plaine, on calcule avec les yeux : les points, la boîte de dix, la droite. Chaque calcul réussi, c’est de la brique pour le village.',
      lines: [
        'Compte mes points par cinq : deux rangées de cinq, ça fait dix.',
        'Un nombre et son complément font toujours dix. Comme mes deux ailes.',
        'Ma maison est en brique. Chaque calcul en pose une.',
        'Depuis mon brin d’herbe, je vois le port : un pont, un quai, un bateau. Tout ça se mesure.',
        'Le tour du quai, je l’ai fait à pied : tous les côtés, un par un, sans raccourci.',
      ],
      home: 'Mon nid de brique est fini ! Il a exactement dix fenêtres, comme mes points.',
    },
    exercises: [
      { id: 'tables', title: 'Champ des tables', description: 'Une multiplication, et la grille de points pour la voir.', programme: ['c3.ma.nombres.faits-numeriques'] },
      { id: 'complements', title: 'Pont de dix', description: 'Trouve ce qui manque pour arriver à 10 ou à 100.', programme: ['c3.ma.nombres.calcul-mental'] },
      { id: 'doubles', title: 'Doubles et moitiés', description: 'Le double ou la moitié d’un nombre, en deux étapes.', programme: ['c3.ma.nombres.calcul-mental'] },
      {
        id: 'passeur',
        title: 'Carnet du passeur',
        description: 'Un pont, un quai, une traversée : lis le schéma, puis calcule la longueur, le tour ou l’heure.',
        programme: ['c3.ma.nombres.problemes', 'c3.ma.grandeurs.perimetre', 'c3.ma.grandeurs.durees'],
      },
    ],
  },
  {
    id: 'riviere',
    name: 'Rivière des fractions',
    module: 'Fractions',
    subject: 'maths',
    classe: '6e',
    description: 'Lire, comparer et partager des fractions, toujours avec la figure sous les yeux.',
    block: 'galet',
    guardian: 'le Brochet d’argent',
    icon: 'pizza',
    creature: {
      name: 'Nénu',
      greeting:
        'Coâ ! Bienvenue à la rivière. Ici, on coupe en parts égales et on regarde la figure avant de répondre. Chaque fraction lue, c’est un galet pour le village.',
      lines: [
        'Un nénuphar coupé en quatre : chaque part, c’est un quart.',
        'Plus il y a de parts, plus chaque part est petite. Même pour les moucherons.',
        'Ma hutte est en galets. Chaque fraction en apporte un.',
      ],
      home: 'Ma hutte de galets est finie ! Une moitié pour dormir, une moitié pour chanter.',
    },
    exercises: [
      { id: 'nenuphars', title: 'Nénuphars', description: 'Quelle fraction de la figure est coloriée ? Puis sur la droite.', programme: ['c3.ma.nombres.fractions-designations'] },
      { id: 'deux-rives', title: 'Deux rives', description: 'Compare deux fractions avec les barres sous les yeux.', programme: ['c3.ma.nombres.fractions-comparer'] },
      { id: 'partage', title: 'Partage du gâteau', description: 'Une fraction d’une quantité, puis des fractions égales.', programme: ['c3.ma.nombres.fractions-designations', 'c3.ma.nombres.fractions-comparer'] },
    ],
  },
  {
    id: 'volcan',
    name: 'Volcan des décimaux',
    module: 'Nombres décimaux',
    subject: 'maths',
    classe: '6e',
    description: 'Lire, comparer et placer des nombres à virgule, le tableau de numération toujours affiché.',
    block: 'obsidienne',
    guardian: 'le Dragon de cendre',
    icon: 'flame',
    creature: {
      name: 'Lavi',
      greeting:
        'Salut, bâtisseur ! Sur mon volcan, la virgule sépare les unités des dixièmes. Regarde le tableau avant de répondre. Chaque nombre lu, c’est de l’obsidienne pour le village.',
      lines: [
        'La virgule, c’est la frontière : à gauche les unités, à droite les dixièmes.',
        'Le plus long n’est pas le plus grand ! 3,5 bat 3,45.',
        'Mon abri est en obsidienne, noire et brillante. Chaque nombre en apporte une.',
      ],
      home: 'Mon abri d’obsidienne est fini ! Il brille comme 1,0 : entier et sans un dixième qui manque.',
    },
    exercises: [
      { id: 'cratere', title: 'Cratère des rangs', description: 'Quel est le chiffre des dixièmes ? Puis la fraction décimale.', programme: ['c3.ma.nombres.decimaux-ecritures', 'c3.ma.nombres.calcul-mental'] },
      { id: 'coulee', title: 'Coulée de lave', description: 'Compare deux décimaux, tableau sous les yeux.', programme: ['c3.ma.nombres.decimaux-comparer'] },
      { id: 'pente', title: 'Pente graduée', description: 'Repère un décimal sur la droite, puis complète jusqu’à 1.', programme: ['c3.ma.nombres.decimaux-comparer', 'c3.ma.nombres.calcul-mental'] },
    ],
  },
  {
    id: 'glacier',
    name: 'Glacier des relatifs',
    module: 'Nombres relatifs et fractions',
    subject: 'maths',
    classe: '5e',
    description: 'Comparer et calculer avec des nombres négatifs, la droite sous les yeux, puis avec des fractions.',
    block: 'glace',
    guardian: 'le Mammouth de givre',
    icon: 'mountain',
    creature: {
      name: 'Frimas',
      greeting:
        'Salut, bâtisseur ! Ici, il fait moins dix. Les nombres négatifs, c’est à gauche de zéro sur la droite. Chaque calcul réussi, c’est de la glace pour le village.',
      lines: [
        'Moins cinq, c’est plus petit que moins deux. Plus on va à gauche, plus il fait froid.',
        'Soustraire, c’est ajouter l’opposé. Comme enlever un manteau.',
        'Mon igloo est en glace. Chaque calcul en taille un bloc.',
        'Un iceberg ne montre qu’une fraction de lui : le reste dort sous l’eau.',
      ],
      home: 'Mon igloo est fini ! Dedans il fait plus deux, dehors moins huit.',
    },
    exercises: [
      { id: 'thermometre', title: 'Thermomètre', description: 'Compare deux relatifs, puis lis un point sur la droite.', programme: ['c4.ma.a.relatifs', 'c4.ma.d.reperage'] },
      { id: 'banquise', title: 'Banquise', description: 'Additionne et soustrais des relatifs avec le bond sur la droite.', programme: ['c4.ma.a.calcul-relatifs'] },
      { id: 'crevasses', title: 'Crevasses', description: 'Multiplie et divise avec la règle des signes affichée.', programme: ['c4.ma.a.calcul-relatifs'] },
      { id: 'icebergs', title: 'Icebergs des fractions', description: 'Compare, puis additionne, soustrais, multiplie et divise des fractions : la règle reste affichée.', programme: ['c4.ma.a.fractions', 'c4.ma.a.calcul-fractions'] },
    ],
  },
  {
    id: 'marche',
    name: 'Marché des proportions',
    module: 'Proportionnalité',
    subject: 'maths',
    classe: '5e',
    description: 'Tableaux de proportionnalité, pourcentages, vitesses, échelles et partages, avec le tableau ou le schéma toujours affiché.',
    block: 'toile',
    guardian: 'le Colporteur',
    icon: 'ruler',
    creature: {
      name: 'Bazar',
      greeting:
        'Bienvenue au marché, bâtisseur ! Ici tout est proportionnel : deux fois plus de pommes, deux fois plus d’euros. Chaque compte juste, c’est de la toile pour le village.',
      lines: [
        'Trois pommes, six euros. Une pomme ? Passe par un seul, toujours.',
        'Cinquante pour cent, c’est la moitié. Même pour les raisins.',
        'Mon échoppe est en toile. Chaque compte juste en tend un morceau.',
        'Deux navires, une cargaison : compte d’abord les parts, puis ce que vaut une part.',
        'Sur ma carte, un centimètre, c’est tout un bout de mer. J’ai vérifié… deux fois.',
      ],
      home: 'Mon échoppe est montée ! Cent pour cent finie, pas une remise.',
    },
    exercises: [
      {
        id: 'etals',
        title: 'Étals',
        description: 'Complète un tableau de proportionnalité, puis partage une cargaison entre les navires selon un ratio.',
        programme: ['c4.ma.b.proportionnalite', 'c4.ma.b.ratio', 'c3.ma.nombres.proportionnalite'],
      },
      { id: 'remises', title: 'Remises', description: 'Prends un pourcentage, puis applique une hausse ou une baisse.', programme: ['c4.ma.b.pourcentages-echelles', 'c3.ma.nombres.proportionnalite'] },
      { id: 'balances', title: 'Balances', description: 'Vitesses constantes et échelles de carte, puis la carte de l’archipel, en mots ou en fraction, puis une traversée : la distance, la vitesse ou la durée, les minutes changées en heures.', programme: ['c4.ma.c.grandeurs-composees', 'c4.ma.b.pourcentages-echelles', 'c3.ma.espace.echelle', 'c4.ma.c.conversions'] },
    ],
  },
  {
    id: 'carrefour',
    name: 'Carrefour des homophones',
    module: 'Homophones grammaticaux',
    subject: 'francais',
    classe: '5e',
    description: 'Ses ou ces, quel ou qu’elle, sans ou s’en : choisir le bon mot, la règle sous les yeux.',
    block: 'panneau',
    guardian: 'le Sphinx des routes',
    icon: 'compass',
    creature: {
      name: 'Sema',
      greeting:
        'Salut, bâtisseur ! Au carrefour, deux mots se ressemblent mais ne mènent pas au même endroit. Remplace-les pour vérifier. Chaque bonne route, c’est un panneau pour le village.',
      lines: [
        'Ses, ces, c’est, s’est : quatre routes, un seul bon chemin.',
        'Remplace par « avait » : si ça marche, c’est « a » sans accent.',
        'Ma cabane est faite de panneaux. Chaque bonne réponse en cloue un.',
      ],
      home: 'Ma cabane est finie ! Tous ses panneaux montrent la bonne direction.',
    },
    exercises: [
      { id: 'panneaux', title: 'Panneaux', description: 'Ses / ces, ou / où, la / là / l’a, leur / leurs, quand, peu, c’est / s’est.', programme: ['c4.fr.langue.orthographe-lexicale', 'c3.fr.langue.homophonie'] },
      { id: 'aiguillage', title: 'Aiguillage', description: 'Quel / qu’elle, sans / s’en, dans / d’en, ni / n’y, plus tôt / plutôt…', programme: ['c4.fr.langue.orthographe-lexicale', 'c3.fr.langue.homophonie'] },
      { id: 'bifurcation', title: 'Bifurcation', description: 'Deux trous dans la phrase : choisis la bonne paire de mots.', programme: ['c4.fr.langue.orthographe-lexicale', 'c3.fr.langue.homophonie'] },
    ],
  },
  {
    id: 'marais',
    name: 'Marais des temps',
    module: 'Conjugaison',
    subject: 'francais',
    classe: '5e',
    description: 'Imparfait, passé composé, passé simple, futur, conditionnel, subjonctif : le bon temps, la règle affichée.',
    block: 'tourbe',
    guardian: 'l’Hydre des marais',
    icon: 'footprints',
    creature: {
      name: 'Kroa',
      greeting:
        'Coâ… non, ça c’est Nénu. Bienvenue au marais, bâtisseur ! Ici chaque rive est un temps : le passé, le futur, et le subjonctif dans les roseaux. Chaque verbe juste, c’est de la tourbe pour le village.',
      lines: [
        'Hier je nageais, hier j’ai nagé : l’un dure, l’autre est fini.',
        'Demain je nagerai. Si j’avais des ailes, je volerais.',
        'Il faut que tu viennes voir ma hutte de tourbe.',
      ],
      home: 'Ma hutte de tourbe est finie ! Elle était en ruine, elle est debout, elle restera.',
    },
    exercises: [
      { id: 'rives', title: 'Rives du passé', description: 'Imparfait ou passé composé, puis le passé simple du récit.', programme: ['c3.fr.langue.temps-a-memoriser', 'c4.fr.langue.valeurs-des-temps'] },
      { id: 'brume', title: 'Brume du futur', description: 'Futur ou conditionnel, puis les formes du futur.', programme: ['c4.fr.langue.temps-a-memoriser', 'c3.fr.langue.temps-a-memoriser'] },
      { id: 'roseaux', title: 'Roseaux du subjonctif', description: 'Le subjonctif présent, puis reconnaître le temps d’un verbe.', programme: ['c4.fr.langue.temps-a-memoriser', 'c4.fr.langue.morphologie-verbale', 'c3.fr.langue.reconnaitre-verbe'] },
    ],
  },
  {
    id: 'forge',
    name: 'Forge des puissances',
    module: 'Puissances et racines',
    subject: 'maths',
    classe: '4e',
    description: 'Puissances de 10, notation scientifique, puissances, racines carrées, nombres premiers.',
    block: 'acier',
    guardian: 'le Titan d’acier',
    icon: 'zap',
    creature: {
      name: 'Braise',
      greeting:
        'Salut, bâtisseur ! À la forge, dix fois dix fois dix, ça s’écrit 10³. Regarde la règle avant de frapper. Chaque calcul juste, c’est de l’acier pour le village.',
      lines: [
        '10⁶ : un million. Un 1 et six zéros, comme mes six enclumes.',
        '2³, c’est 2 × 2 × 2 = 8. Pas 6 ! Le marteau compte trois coups.',
        'Mon atelier est en acier. Chaque calcul en forge une plaque.',
      ],
      home: 'Mon atelier d’acier est fini ! Solide comme 10 puissance 10.',
    },
    exercises: [
      { id: 'etincelles', title: 'Étincelles', description: 'Puissances de 10, puis notation scientifique.', programme: ['c4.ma.a.puissances', 'c4.ma.a.ecritures-ordres-de-grandeur'] },
      { id: 'enclume', title: 'Enclume', description: 'Puissances d’un nombre, puis produits et quotients de puissances.', programme: ['c4.ma.a.puissances'] },
      { id: 'trempe', title: 'Trempe', description: 'Racines carrées, puis diviseurs et nombres premiers, puis décomposition en facteurs premiers.', programme: ['c4.ma.a.carres-racine', 'c4.ma.a.divisibilite-premiers', 'c3.ma.nombres.divisibilite'] },
    ],
  },
  {
    id: 'atelier',
    name: 'Atelier du calcul littéral',
    module: 'Calcul littéral et équations',
    subject: 'maths',
    classe: '4e',
    description: 'Réduire, développer, résoudre une équation : les lettres comme des blocs, la règle affichée.',
    block: 'calque',
    guardian: 'le Golem des équations',
    icon: 'ruler',
    creature: {
      name: 'Ixe',
      greeting:
        'Bip. Bonjour, bâtisseur ! Ici, x est un bloc dont on ne connaît pas encore la taille. On le range, on le développe, on le trouve. Chaque calcul juste, c’est un calque pour le village.',
      lines: [
        '3x + 5x = 8x. Trois blocs plus cinq blocs, huit blocs.',
        'Une équation, c’est une balance : même geste des deux côtés.',
        'Mon bureau est en calques. Chaque calcul en trace un.',
      ],
      home: 'Mon bureau de calques est fini ! Plan développé, réduit, résolu.',
    },
    exercises: [
      { id: 'reduire', title: 'Réduire', description: 'Regroupe les x et les nombres.', programme: ['c4.ma.a.reduire-developper'] },
      { id: 'developper', title: 'Développer', description: 'Distributivité simple, puis double, puis factoriser.', programme: ['c4.ma.a.reduire-developper'] },
      { id: 'equilibre', title: 'Équilibre', description: 'Équations du premier degré, en une puis deux étapes, puis tester une égalité et les équations produits.', programme: ['c4.ma.a.equations'] },
    ],
  },
  {
    id: 'falaise',
    name: 'Falaise des accords',
    module: 'Accords',
    subject: 'francais',
    classe: '4e',
    description: 'Participe passé, adjectifs, sujet caché : accorder sans se tromper, la règle sous les yeux.',
    block: 'ardoise',
    guardian: 'le Bélier de granit',
    icon: 'mountain',
    creature: {
      name: 'Cléa',
      greeting:
        'Bêêê, bâtisseur ! Sur la falaise, chaque mot s’accroche à un autre : l’adjectif au nom, le verbe au sujet, le participe à qui de droit. Chaque accord juste, c’est une ardoise pour le village.',
      lines: [
        'Les filles sont parties : avec être, le participe suit le sujet.',
        'Qui est-ce qui grimpe ? Voilà le sujet, voilà l’accord.',
        'Ma bergerie est en ardoise. Chaque accord en pose une.',
      ],
      home: 'Ma bergerie d’ardoise est finie ! Elle est solide, elles sont solides, tout est accordé.',
    },
    exercises: [
      { id: 'corde', title: 'Corde du participe', description: 'Participe passé avec être, avec avoir, puis avec le COD placé avant.', programme: ['c4.fr.langue.participe-passe', 'c3.fr.langue.attribut-participe-etre'] },
      { id: 'paroi', title: 'Paroi des adjectifs', description: 'Accord de l’adjectif et de l’attribut, puis les couleurs et cas particuliers.', programme: ['c4.fr.langue.accord-gn-complexe', 'c3.fr.langue.accord-gn'] },
      { id: 'sommet', title: 'Sommet du sujet', description: 'Trouver le sujet : inversé, éloigné, « on », « qui », deux sujets.', programme: ['c4.fr.langue.accord-verbe-complexe'] },
    ],
  },
  {
    id: 'cabinet',
    name: 'Cabinet des mots',
    module: 'Vocabulaire',
    subject: 'francais',
    classe: '4e',
    description: 'Racines grecques et latines, préfixes et suffixes, sens propre et figuré, champ lexical, synonymes, registres et intensité.',
    block: 'parchemin',
    guardian: 'le Hibou lexicographe',
    icon: 'library',
    creature: {
      name: 'Plume',
      greeting:
        'Bonjour, bâtisseur ! Dans mon cabinet, chaque mot est un objet qu’on démonte : une racine, un préfixe, un suffixe. Chaque mot compris, c’est un parchemin pour le village.',
      lines: [
        'Télé-phone : la voix, de loin. Deux morceaux, un mot.',
        'Une pluie de cadeaux ne mouille pas : c’est le sens figuré.',
        'Mon nid est en parchemins. Chaque mot en roule un.',
      ],
      home: 'Mon nid de parchemins est fini ! Au sens propre : il tient. Au figuré : c’est un trésor.',
    },
    exercises: [
      { id: 'racines', title: 'Racines', description: 'Racines grecques et latines, puis préfixes et suffixes.', programme: ['c4.fr.langue.formation-des-mots'] },
      { id: 'sens', title: 'Sens', description: 'Sens propre ou sens figuré, expressions imagées, puis le champ lexical.', programme: ['c4.fr.langue.sens-des-mots', 'c4.fr.langue.reseaux-de-mots'] },
      { id: 'nuances', title: 'Nuances', description: 'Synonymes, antonymes, registres de langue, puis le degré d’intensité.', programme: ['c4.fr.langue.sens-des-mots', 'c4.fr.langue.reseaux-de-mots', 'c4.fr.langue.oral-ecrit', 'c3.fr.langue.synonymie'] },
    ],
  },
  {
    id: 'belvedere',
    name: 'Belvédère de Thalès',
    module: 'Géométrie : Pythagore, Thalès, trigonométrie',
    subject: 'maths',
    classe: '3e',
    description: 'Une longueur manquante dans un triangle rectangle ou une configuration de Thalès, la figure codée sous les yeux ; puis les réciproques : le triangle est-il rectangle, les droites sont-elles parallèles ?',
    block: 'marbre',
    guardian: 'le Sphinx de marbre',
    icon: 'compass',
    creature: {
      name: 'Théo',
      greeting:
        'Bonjour, bâtisseur ! Du belvédère, on voit tous les triangles. L’hypoténuse est toujours en face de l’angle droit : regarde la figure avant de calculer. Chaque longueur trouvée, c’est du marbre pour le village.',
      lines: [
        'Trois, quatre, cinq : le plus vieux triangle rectangle du monde.',
        'Deux droites parallèles, et les longueurs se multiplient par le même nombre.',
        'Mon kiosque est en marbre. Chaque calcul en taille une colonne.',
      ],
      home: 'Mon kiosque de marbre est fini ! Ses colonnes sont proportionnelles, Thalès serait content.',
    },
    exercises: [
      { id: 'pythagore', title: 'Pythagore', description: 'L’hypoténuse, puis un côté de l’angle droit, puis le câble d’un mât, enfin la réciproque : le triangle est-il rectangle ?', programme: ['c4.ma.d.pythagore', 'c4.ma.a.carres-racine'] },
      { id: 'thales', title: 'Thalès', description: 'Une longueur manquante avec deux droites parallèles, puis la hauteur d’un mât ou son ombre, mesurée avec un bâton, enfin la réciproque : les droites sont-elles parallèles ?', programme: ['c4.ma.d.thales'] },
      { id: 'trigo', title: 'Trigo', description: 'Cosinus, sinus ou tangente : le bon rapport.', programme: ['c4.ma.d.trigonometrie'] },
    ],
  },
  {
    id: 'donnees',
    name: 'Observatoire des données',
    module: 'Statistiques et probabilités',
    subject: 'maths',
    classe: '3e',
    description: 'Moyenne, médiane, étendue d’une petite série, probabilités simples, diagrammes et fréquences, les barres sous les yeux.',
    block: 'quartz',
    guardian: 'le Comptable des étoiles',
    icon: 'star',
    creature: {
      name: 'Stat',
      greeting:
        'Hou ! Bienvenue à l’observatoire, bâtisseur. Ici, on résume une série en un seul nombre : la moyenne, la médiane. Et on prévoit avec les probabilités. Chaque calcul juste, c’est du quartz pour le village.',
      lines: [
        'La moyenne : tout additionner, puis partager équitablement.',
        'La médiane coupe la série rangée en deux moitiés.',
        'Mon dôme est en quartz. Chaque calcul en polit une facette.',
        'Dans mon carnet de relevés, chaque barre porte son effectif. Additionne-les tous : c’est l’effectif total.',
      ],
      home: 'Mon dôme de quartz est fini ! En moyenne, un bloc par calcul ; en médiane, pareil.',
    },
    exercises: [
      { id: 'moyenne', title: 'Moyenne', description: 'La moyenne, puis la médiane et l’étendue d’une petite série.', programme: ['c4.ma.b.indicateurs'] },
      { id: 'chances', title: 'Chances', description: 'Probabilités simples : sac de boules, dé.', programme: ['c4.ma.b.probabilites'] },
      { id: 'releves', title: 'Relevés', description: 'Lis un diagramme ou un tableau, puis calcule une fréquence, en fraction et en pourcentage.', programme: ['c4.ma.b.lire-donnees', 'c4.ma.b.effectifs-frequences'] },
    ],
  },
  {
    id: 'phare',
    name: 'Phare des fonctions',
    module: 'Fonctions',
    subject: 'maths',
    classe: '3e',
    description: 'Image, antécédent, fonction linéaire ou affine : le tableau de valeurs toujours affiché.',
    block: 'prisme',
    guardian: 'le Dragon de lumière',
    icon: 'lightbulb',
    creature: {
      name: 'Fi',
      greeting:
        'Bonjour, bâtisseur ! Une fonction, c’est une machine : on entre x, il sort f(x). Le tableau de valeurs te montre les deux. Chaque image trouvée, c’est un prisme pour le village.',
      lines: [
        'Entre x, sors f(x) : ma lumière fait pareil, elle transforme.',
        'Linéaire : la droite passe par l’origine. Affine : elle est décalée de b.',
        'Ma lanterne est en prismes. Chaque calcul en pose un.',
      ],
      home: 'Ma lanterne de prismes est finie ! f(nuit) = lumière.',
    },
    exercises: [
      { id: 'images', title: 'Images', description: 'L’image d’un nombre, puis son antécédent.', programme: ['c4.ma.b.image-antecedent'] },
      { id: 'droites', title: 'Droites', description: 'Coefficient directeur, fonction linéaire ou affine.', programme: ['c4.ma.b.lineaire-affine'] },
    ],
  },
  {
    id: 'textes',
    name: 'Observatoire des textes',
    module: 'Lecture fine et grammaire',
    subject: 'francais',
    classe: '3e',
    description: 'Lire entre les lignes, reconnaître les figures de style, la nature et la fonction des mots.',
    block: 'lentille',
    guardian: 'le Grand Lecteur',
    icon: 'book',
    creature: {
      name: 'Astra',
      greeting:
        'Bonsoir, bâtisseur ! De l’observatoire, on lit les textes comme le ciel : on cherche ce qui brille derrière les mots. Chaque indice trouvé, c’est une lentille pour le village.',
      lines: [
        'Un parapluie fermé et des cheveux mouillés : le texte n’a pas dit « pluie », et pourtant.',
        'Rapide comme l’éclair : le « comme » fait la comparaison.',
        'Ma lanterne est en lentilles. Chaque lecture en polit une.',
      ],
      home: 'Ma lanterne de lentilles est finie ! Elle grossit les mots pour mieux les lire.',
    },
    exercises: [
      { id: 'inferences', title: 'Inférences', description: 'Ce que la phrase laisse comprendre sans le dire.', programme: ['c4.fr.lecture.controle', 'c3.fr.lecture.implicite'] },
      { id: 'figures', title: 'Figures', description: 'Comparaison, métaphore, personnification, hyperbole, litote…', programme: ['c4.fr.lecture.procedes'] },
      { id: 'rouages', title: 'Rouages', description: 'Nature et fonction des mots, connecteurs logiques.', programme: ['c4.fr.langue.sujet-complements', 'c4.fr.langue.classes-de-mots', 'c4.fr.langue.coherence-textuelle', 'c3.fr.langue.nature-fonction', 'c3.fr.langue.classes-de-mots', 'c3.fr.langue.complements'] },
    ],
  },
  {
    id: 'baie',
    name: 'Baie des mots',
    module: 'Vocabulaire et écoute',
    subject: 'anglais',
    classe: '6e',
    description: 'Se présenter, compter, dire l’heure, reconnaître un mot à l’oreille : l’anglais de tous les jours.',
    block: 'cabine',
    guardian: 'le Lion de pierre',
    icon: 'languages',
    creature: {
      name: 'Robin',
      greeting:
        'Hello, bâtisseur ! Dans la baie, on parle anglais. Écoute bien : le bouton Écouter lit chaque mot avec une voix anglaise. Chaque mot compris, c’est une cabine rouge pour le village.',
      lines: [
        'Thirteen ou thirty ? Écoute la fin : -teen, c’est de 13 à 19.',
        'Hello pour arriver, goodbye pour partir.',
        'Ma maison est une cabine rouge. Chaque bonne réponse en peint un carreau.',
      ],
      home: 'Ma cabine est finie ! On peut appeler jusqu’à Londres.',
    },
    exercises: [
      { id: 'hello', title: 'Hello', description: 'Saluer, se présenter, les phrases de la classe.', programme: ['c3.en.dialoguer.contact-social', 'c3.en.ecouter.consignes'] },
      { id: 'numbers', title: 'Numbers', description: 'Les nombres (-teen ou -ty ?), l’heure et la date.', programme: ['c3.en.culture.vie-quotidienne', 'c3.en.langue.phonologie', 'c3.en.langue.phonie-graphie'] },
      { id: 'ears', title: 'Ears', description: 'Écouter un mot anglais et trouver son sens (house ou horse ?).', programme: ['c3.en.ecouter.mots-familiers', 'c3.en.langue.phonie-graphie'] },
    ],
  },
  {
    id: 'horloge',
    name: 'Horloge des verbes',
    module: 'Grammaire : to be, have got, présent simple',
    subject: 'anglais',
    classe: '6e',
    description: 'Am, is ou are ; have ou has ; le s de he, she, it : les verbes de base, la règle sous les yeux.',
    block: 'cadran',
    guardian: 'le Coucou de bronze',
    icon: 'history',
    creature: {
      name: 'Tick',
      greeting:
        'Hello, bâtisseur ! Dans mon horloge, chaque verbe a sa place : am, is ou are, have ou has. Regarde d’abord le sujet, la règle est affichée. Chaque bon verbe, c’est un cadran pour le village.',
      lines: [
        'He, she, it : un seul, alors is, has, et un s au verbe.',
        'I am, you are, he is : tic, tac, toc.',
        'Ma maison est une horloge. Chaque bonne réponse en fait tourner une aiguille.',
      ],
      home: 'Mon horloge est finie ! Elle sonne à chaque verbe juste.',
    },
    exercises: [
      { id: 'to-be', title: 'To be', description: 'Am, is, are ; la négation et la question.', programme: ['c3.en.langue.groupe-verbal', 'c3.en.langue.phrase'] },
      { id: 'have-got', title: 'Have got', description: 'Have got ou has got, pour dire ce qu’on a.', programme: ['c3.en.langue.groupe-verbal'] },
      { id: 'present-simple', title: 'Présent simple', description: 'Le s de he, she, it ; do et does pour la question et la négation.', programme: ['c3.en.langue.groupe-verbal', 'c3.en.langue.phrase'] },
    ],
  },
  {
    id: 'comptoir',
    name: 'Comptoir',
    module: 'Vocabulaire et compréhension',
    subject: 'anglais',
    classe: '5e',
    description: 'Faire ses courses, raconter sa journée, comprendre une phrase entendue, lire un panneau ou un horaire : l’anglais du quotidien.',
    block: 'tuile',
    guardian: 'la Reine du marché',
    icon: 'languages',
    creature: {
      name: 'Pudding',
      greeting:
        'Hello, bâtisseur ! Au Comptoir, on achète, on compte, on raconte sa journée, en anglais. Écoute bien chaque phrase : la voix anglaise la lit pour toi. Chaque bonne réponse, c’est une tuile pour le village.',
      lines: [
        'Chips, ce sont des frites ; crisps, ce sont des chips !',
        'How much is it? Ça veut dire : combien ça coûte ?',
        'Ma boutique a un toit de tuiles. Chaque bonne réponse en pose une.',
        'Ma boutique rouvre à 2 pm, donc à 14 h : pm, ça veut dire après midi !',
      ],
      home: 'Ma boutique est finie ! Open every day, même le dimanche.',
    },
    exercises: [
      { id: 'shopping', title: 'Shopping', description: 'Au magasin : quantités, prix, repas.', programme: ['c4.en.dialoguer.echanges-sociaux', 'c3.en.dialoguer.renseignements', 'c4.en.langue.lexique'] },
      { id: 'routine', title: 'Routine', description: 'La journée (get up, have breakfast…) et always, often, never.', programme: ['c4.en.langue.temps-verbaux', 'c3.en.culture.vie-quotidienne'] },
      { id: 'listening', title: 'Listening', description: 'Écouter une phrase et trouver son sens.', programme: ['c4.en.ecouter.intervention-breve'] },
      { id: 'notices', title: 'Notices', description: 'Lire un panneau, une consigne, un menu ou un horaire, et y trouver ce qu’on cherche.', programme: ['c4.en.lire.consignes-panneaux', 'c4.en.lire.informations', 'c4.en.langue.lexique'] },
    ],
  },
  {
    id: 'manoir',
    name: 'Manoir du passé',
    module: 'Grammaire : -ing, prétérit, comparatifs',
    subject: 'anglais',
    classe: '5e',
    description: 'Ce qui se passe maintenant, ce qui s’est passé hier, et qui est le plus grand : la règle sous les yeux.',
    block: 'lambris',
    guardian: 'le Spectre du manoir',
    icon: 'history',
    creature: {
      name: 'Moustache',
      greeting:
        'Hello, bâtisseur ! Au manoir, chaque pièce a son temps : ce qui se passe now, ce qui s’est passé yesterday. Cherche le petit mot qui dit quand. Chaque bonne réponse, c’est un lambris pour le village.',
      lines: [
        'Look! The cat is sleeping : en ce moment, be + -ing.',
        'Yesterday, I played : au passé, + ed.',
        'Mon salon est tout en lambris. Chaque bonne réponse en cire un.',
      ],
      home: 'Mon salon est fini ! Il est bien plus beau qu’avant : more beautiful than before.',
    },
    exercises: [
      { id: 'ing', title: '-ing', description: 'Be + -ing (maintenant) ou présent simple (d’habitude).', programme: ['c4.en.langue.temps-verbaux'] },
      { id: 'preterit', title: 'Prétérit', description: 'Was, were, les verbes en -ed ; did pour la question et la négation.', programme: ['c4.en.langue.temps-verbaux'] },
      { id: 'comparatifs', title: 'Comparatifs', description: 'Taller than, the tallest, more… than, better, the best.', programme: ['c4.en.langue.groupe-nominal', 'c3.en.langue.groupe-nominal'] },
    ],
  },
  {
    id: 'theatre',
    name: 'Théâtre des voix',
    module: 'Compréhension, quantités, prétérit irrégulier',
    subject: 'anglais',
    classe: '4e',
    description: 'Répondre à une question entendue, dire combien, raconter au passé : l’anglais sur scène.',
    block: 'velours',
    guardian: 'le Masque',
    icon: 'languages',
    creature: {
      name: 'Puck',
      greeting:
        'Hello, bâtisseur ! Au théâtre, chaque question appelle une réplique : where, when, why… Écoute bien le premier mot. Chaque bonne réplique, c’est un velours pour le village.',
      lines: [
        'Where = où, when = quand, why = pourquoi : écoute le premier mot.',
        'Some pour dire oui, any pour la question et la négation.',
        'Ma loge est en velours rouge. Chaque bonne réplique en coud un pan.',
      ],
      home: 'Ma loge est finie ! The show must go on.',
    },
    exercises: [
      { id: 'dialogues', title: 'Dialogues', description: 'Écouter une question et choisir la bonne réponse.', programme: ['c4.en.ecouter.intervention-breve', 'c4.en.dialoguer.reagir', 'c3.en.dialoguer.reagir'] },
      { id: 'quantites', title: 'Quantités', description: 'Some, any, much, many, a few, a little, enough.', programme: ['c4.en.langue.groupe-nominal'] },
      { id: 'preterit-irregulier', title: 'Prétérit irrégulier', description: 'Went, saw, bought : les verbes irréguliers au passé.', programme: ['c4.en.langue.temps-verbaux'] },
    ],
  },
  {
    id: 'gare',
    name: 'Gare du futur',
    module: 'Grammaire : futur, modaux, present perfect',
    subject: 'anglais',
    classe: '4e',
    description: 'Ce qui arrivera, ce qu’on peut ou doit faire, ce qu’on a déjà fait : la règle sous les yeux.',
    block: 'rail',
    guardian: 'la Locomotive de fer',
    icon: 'history',
    creature: {
      name: 'Vapeur',
      greeting:
        'Hello, bâtisseur ! À la gare, on parle de demain (will, going to), de ce qu’on doit faire (must, have to) et de ce qu’on a déjà fait (have been). Chaque bonne réponse, c’est un rail pour le village.',
      lines: [
        'Will pour prédire, going to pour un projet.',
        'Mustn’t, c’est interdit ; don’t have to, ce n’est pas obligé.',
        'Mon abri est au bout du quai. Chaque bonne réponse pose un rail.',
      ],
      home: 'Mon abri est fini ! The next train will arrive on time.',
    },
    exercises: [
      { id: 'futur', title: 'Futur', description: 'Will et be going to.', programme: ['c4.en.langue.temps-verbaux'] },
      { id: 'modaux', title: 'Modaux', description: 'Can, must, should, have to.', programme: ['c4.en.langue.modaux-passif'] },
      { id: 'present-perfect', title: 'Present perfect', description: 'Have been, ever, never, already, yet, just.', programme: ['c4.en.langue.temps-verbaux'] },
    ],
  },
  {
    id: 'studio',
    name: 'Studio des ondes',
    module: 'Compréhension, connecteurs, faux amis',
    subject: 'anglais',
    classe: '3e',
    description: 'Comprendre un petit texte, relier ses idées, se méfier des faux amis : l’anglais de la radio.',
    block: 'antenne',
    guardian: 'la Grande Antenne',
    icon: 'languages',
    creature: {
      name: 'Écho',
      greeting:
        'Hello, bâtisseur ! Au studio, on lit et on écoute des messages entiers : qui, quand, pourquoi ? Et attention aux faux amis : library n’est pas une librairie ! Chaque message compris, c’est une antenne pour le village.',
      lines: [
        'Actually, ça veut dire « en fait », pas « actuellement ».',
        'Because pour la cause, so pour la conséquence, but pour l’opposition.',
        'Ma régie est hérissée d’antennes. Chaque bonne réponse en dresse une.',
      ],
      home: 'Ma régie est finie ! On the air!',
    },
    exercises: [
      { id: 'comprendre', title: 'Comprendre', description: 'Un petit texte, une question : trouver la réponse, même quand elle n’est pas écrite.', programme: ['c4.en.lire.informations', 'c4.en.lire.recit'] },
      { id: 'connecteurs', title: 'Connecteurs', description: 'Because, so, but, although, however, unless…', programme: ['c4.en.langue.phrase-complexe'] },
      { id: 'faux-amis', title: 'Faux amis', description: 'Actually, library, sensible : des mots qui ressemblent au français, mais trompent.', programme: ['c4.en.langue.lexique'] },
    ],
  },
  {
    id: 'chateau',
    name: 'Château des hypothèses',
    module: 'Grammaire : for et since, if, passif',
    subject: 'anglais',
    classe: '3e',
    description: 'Depuis quand, et si…, et par qui : les phrases longues de 3e, la règle sous les yeux.',
    block: 'taille',
    guardian: 'le Dragon gallois',
    icon: 'castle',
    creature: {
      name: 'Knight',
      greeting:
        'Hello, bâtisseur ! Au château, les phrases sont longues : depuis quand (for, since), et si (if), et par qui (by). Pas de panique, la règle est affichée. Chaque bonne réponse, c’est une pierre de taille pour le village.',
      lines: [
        'For une durée, since un point de départ.',
        'If I were a dragon, I would fly : si j’étais un dragon, je volerais.',
        'Ma tour est en pierre de taille. Chaque bonne réponse en scelle une.',
      ],
      home: 'Ma tour est finie ! If I were you, I would climb to the top.',
    },
    exercises: [
      { id: 'for-since', title: 'For / since', description: 'For, since, ago ; present perfect ou prétérit.', programme: ['c4.en.langue.temps-verbaux'] },
      { id: 'if', title: 'If', description: 'Si… : le réel (will) et l’imaginaire (would).', programme: ['c4.en.langue.phrase-complexe'] },
      { id: 'passif', title: 'Passif', description: 'Is spoken, was built, will be shown : be + participe passé.', programme: ['c4.en.langue.modaux-passif'] },
    ],
  },
  // La LV2 (allemand ou espagnol), à partir de la 5e : une seule île par archipel, la même pour les deux langues, en bout
  // de chemin (rien n'en dépend). Seules changent les missions, choisies par la LV2 des Réglages (`missionsDe`), et la voix.
  {
    id: 'relais',
    name: 'Relais des voyageurs',
    module: 'Se présenter, compter, décrire',
    subject: 'lv2',
    classe: '5e',
    description: 'Se présenter, compter, parler de sa famille et de son école : les premiers mots du voyage, dans ta deuxième langue.',
    block: 'dalle',
    guardian: 'la Diligence de cuivre',
    icon: 'languages',
    creature: {
      name: 'Lina',
      greeting:
        'Bonjour, bâtisseur ! Au Relais, les voyageurs se présentent, comptent et parlent de leur famille, dans ta deuxième langue. Écoute bien : la voix lit chaque mot pour toi. Chaque bonne réponse, c’est une dalle pour le village.',
      lines: [
        'Chaque année, je vole d’un pays à l’autre : les langues, ça me connaît.',
        'Dans ta deuxième langue, le nom a souvent un petit mot devant. Apprends-les ensemble, comme deux cubes collés.',
        'Un, deux, trois… Les nombres se posent comme des dalles : un par un, à voix haute.',
        'Mon nid est sur la cheminée de l’auberge. Chaque bonne réponse pose une dalle devant la porte.',
      ],
      home: 'Mon auberge est finie ! Les voyageurs peuvent entrer, d’où qu’ils viennent.',
    },
    exercises: [
      // Les missions de chaque langue, dans le même ordre : la borne de même rang ouvre celle de la LV2 choisie.
      { id: 'es-hola', title: 'Hola', description: 'Se présenter : une question en espagnol, la bonne réponse (ser et tener).', programme: ['c4.es.dialoguer.echanges-sociaux', 'c4.es.langue.temps-verbaux', 'c4.es.langue.lexique'], lv2: 'es' },
      { id: 'es-numeros', title: 'Números', description: 'Les nombres entendus : sesenta ou setenta, doce ou dos ?', programme: ['c4.es.ecouter.intervention-breve', 'c4.es.langue.lexique'], lv2: 'es' },
      { id: 'es-familia', title: 'Familia y colegio', description: 'La famille, les consignes de la classe, un panneau ; tu ou tú ?', programme: ['c4.es.lire.consignes-panneaux', 'c4.es.langue.lexique'], lv2: 'es' },
      { id: 'es-el-la', title: 'El, la, los, las', description: 'L’article du nom, au singulier et au pluriel (el día).', programme: ['c4.es.langue.groupe-nominal'], lv2: 'es' },
      { id: 'de-hallo', title: 'Hallo', description: 'Se présenter : une question en allemand, la bonne réponse (sein et haben).', programme: ['c4.de.dialoguer.echanges-sociaux', 'c4.de.langue.temps-verbaux', 'c4.de.langue.lexique'], lv2: 'de' },
      { id: 'de-zahlen', title: 'Zahlen', description: 'Les nombres entendus : -zehn ou -zig, 24 ou 42 ?', programme: ['c4.de.ecouter.intervention-breve', 'c4.de.langue.lexique'], lv2: 'de' },
      { id: 'de-familie', title: 'Familie und Schule', description: 'La famille, les consignes de la classe, un panneau ; schon ou schön ?', programme: ['c4.de.lire.consignes-panneaux', 'c4.de.langue.lexique'], lv2: 'de' },
      { id: 'de-der-die-das', title: 'Der, die, das', description: 'L’article du nom, toujours avec sa majuscule (das Mädchen).', programme: ['c4.de.langue.groupe-nominal'], lv2: 'de' },
    ],
  },
];

/** Les îles d'une matière, dans l'ordre des classes. */
export function biomesOf(subject: Subject): BiomeDef[] {
  const order: Classe[] = ['6e', '5e', '4e', '3e'];
  return BIOMES.filter((b) => b.subject === subject).sort((a, b) => order.indexOf(a.classe) - order.indexOf(b.classe));
}

/**
 * Le nom du Gardien avec sa majuscule, pour un titre ou un début de phrase (« Le Grand Chêne ») ; au milieu d'une
 * phrase, `guardian` garde son article en minuscule (« bats le Grand Chêne »).
 */
export function guardianTitle(biome: Pick<BiomeDef, 'guardian'>): string {
  return biome.guardian.charAt(0).toUpperCase() + biome.guardian.slice(1);
}

/**
 * Les missions qui se jouent sur une île : toutes, sauf celles d'une autre LV2 que celle des Réglages. Avec « Pas de
 * LV2 », l'île de la LV2 n'en a aucune. Les bornes, le Gardien et la progression passent par ici.
 */
export function missionsJouables(biome: Pick<BiomeDef, 'exercises'>, lv2: Lv2Choice = lv2Courante()): ExerciseTypeDef[] {
  return biome.exercises.filter((x) => x.lv2 === undefined || x.lv2 === lv2);
}

/** Ce que dit l'île de la LV2 avec « Pas de LV2 » (lu à l'ouverture de son panneau), qu'elle soit ouverte ou non. */
export const SANS_LV2 = 'Tu n’as pas choisi de LV2 : les missions de ta deuxième langue ne sont pas proposées ici. Tu peux en choisir une dans les Réglages.';

/** Une île de LV2 : ses missions dépendent de la langue choisie. */
export function estIleLv2(biome: Pick<BiomeDef, 'subject'>): boolean {
  return biome.subject === 'lv2';
}

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}
