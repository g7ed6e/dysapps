// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { AnyIconName } from '../components/Icon';

export type BiomeId = 'foret' | 'mine' | 'carriere' | 'ferme' | 'tour';
export type BlockId = 'bois' | 'pierre' | 'sable' | 'terre' | 'verre' | 'or' | 'cristal' | 'toit' | 'porte' | 'lanterne' | 'barriere' | 'escalier';

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
  | 'or'
  | 'cristal'
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
  or: { id: 'or', name: 'Or', top: '#f2c944', side: '#cfa326', texture: 'or', rare: true },
  cristal: { id: 'cristal', name: 'Cristal', top: '#8ff0e8', side: '#4fc3bb', texture: 'cristal', rare: true },
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

export interface ExerciseTypeDef {
  id: string;
  title: string;
  description: string;
}

export interface CreatureDef {
  name: string;
  species: string;
  /** Ce que dit la créature quand on arrive dans son biome. */
  greeting: string;
  /** Petites phrases quand on la touche dans le village. */
  lines: string[];
  /** Quand sa maison (premier plan de l'île) est terminée. */
  home: string;
}

export interface BiomeDef {
  id: BiomeId;
  name: string;
  module: string;
  description: string;
  block: BlockId;
  icon: AnyIconName;
  /** Le Gardien du biome (boss de fin de biome) et ce qu'il dit quand on l'affronte. */
  guardian: string;
  challenge: string;
  /** Ce que dit le Gardien pendant le défi : épreuve réussie, épreuve ratée, et quand il est vaincu. */
  guardianSays: { hit: string; miss: string; beaten: string };
  creature: CreatureDef;
  exercises: ExerciseTypeDef[];
}

/** Ordre de déblocage conseillé : Forêt → Mine → Carrière → Ferme → Tour. */
export const BIOMES: BiomeDef[] = [
  {
    id: 'foret',
    name: 'Forêt des sons',
    module: 'Conscience phonologique',
    description: 'Écouter, couper en syllabes, repérer les sons et les rimes.',
    block: 'bois',
    guardian: 'le Grand Chêne',
    guardianSays: {
      hit: 'Mes branches tremblent. Tu as l’oreille fine.',
      miss: 'Ce n’est rien : même le vent se trompe de feuille. Continue.',
      beaten: 'Je m’incline, bâtisseur·se. La forêt est à toi… et à Mousso.',
    },
    challenge: 'Le Grand Chêne craque : « Tu as bien écouté ma forêt. Montre-moi tout ce que tu sais faire. »',
    icon: 'tree',
    creature: {
      name: 'Mousso',
      species: 'golem de mousse',
      greeting: 'Salut, bâtisseur·se ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
      lines: [
        'Tu entends ? Le vent coupe les mots en syllabes.',
        'Ma cabane a besoin de bois. Viens chasser les sons !',
        'Chaque arbre ici a poussé sur une rime.',
      ],
      home: 'J’habite ici maintenant ! Viens voir ma cabane quand tu veux.',
    },
    exercises: [
      { id: 'abattage', title: 'Abattage syllabique', description: 'Tape autant de coups que de syllabes.' },
      { id: 'chasse-son', title: 'Chasse au son', description: 'Tape les mots où tu entends le son demandé.' },
      { id: 'rimes', title: 'Rimes-échelle', description: 'Empile les mots qui riment pour monter à la cabane.' },
    ],
  },
  {
    id: 'mine',
    name: 'Mine des lettres',
    module: 'Confusions de lettres',
    description: 'b/d, p/q, f/v, ch/j, t/d : ne plus les confondre.',
    block: 'pierre',
    guardian: 'le Golem de roche',
    guardianSays: {
      hit: 'Une fissure ! Tes yeux ne se trompent pas.',
      miss: 'Ma roche est dure, mais tu peux la reprendre. Regarde bien.',
      beaten: 'Je m’écroule… en pierres pour ton village. Bien joué.',
    },
    challenge: 'Le Golem de roche gronde : « Mes lettres se ressemblent toutes. Toi, tu les reconnais ? Prouve-le. »',
    icon: 'pickaxe',
    creature: {
      name: 'Tunel',
      species: 'taupe cubique',
      greeting: 'Bienvenue dans ma mine ! Ici, les lettres se ressemblent, mais mon œil ne se trompe jamais. Pioche les bonnes, je te donne de la pierre.',
      lines: [
        'Un b, un d… regarde bien de quel côté est le ventre.',
        'Ma forge attend sa poutre. Tu as du bois ?',
        'Sous terre, on prend son temps. Moi aussi.',
      ],
      home: 'Ma forge ronfle à nouveau. Écoute : tac, tac, comme des syllabes.',
    },
    exercises: [
      { id: 'filon', title: 'Filon', description: 'Pioche seulement la lettre cible parmi b, d, p, q.' },
      { id: 'oreille', title: 'Oreille du mineur', description: 'Écoute le mot, choisis le bon bloc : vin ou fin ?' },
    ],
  },
  {
    id: 'carriere',
    name: 'Carrière des mots',
    module: 'Orthographe lexicale',
    description: 'Écrire les mots juste, les familles de mots, les mots-outils.',
    block: 'sable',
    guardian: 'la Dune vivante',
    guardianSays: {
      hit: 'Je recule d’un pas. Ce mot était bien écrit.',
      miss: 'Le sable bouge, moi aussi. Réessaie au prochain mot.',
      beaten: 'Je me couche sur la plage. Le chemin est libre, bâtisseur·se.',
    },
    challenge: 'La Dune vivante siffle : « Chaque mot bien écrit me fait reculer. Écris juste, et je te laisserai passer. »',
    icon: 'mountain',
    creature: {
      name: 'Rouxel',
      species: 'renard cubique',
      greeting: 'Hé, bâtisseur·se ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt·e ?',
      lines: [
        'Un mot bien écrit, c’est un bloc qui ne s’effrite pas.',
        'Mon four ! Il me faut du sable et deux pierres.',
        'Le sable, ça vient des mots qu’on a beaucoup lus.',
      ],
      home: 'Le four est chaud ! Tu sens ? Ça sent le pain et les mots bien cuits.',
    },
    exercises: [
      { id: 'mot-troue', title: 'Mot troué', description: 'Glisse le bloc de lettres qui manque.' },
      { id: 'familles', title: 'Familles-craft', description: 'Assemble préfixe, racine et suffixe.' },
      { id: 'coffre', title: 'Coffre à mots', description: 'Les mots-outils à réviser, en dictée.' },
    ],
  },
  {
    id: 'ferme',
    name: 'Ferme des accords',
    module: 'Orthographe grammaticale',
    description: 'Accorder sujet et verbe, choisir a/à, et/est, -é/-er.',
    block: 'terre',
    guardian: 'le Taureau de terre',
    guardianSays: {
      hit: 'Meuh ! Mes sabots glissent. C’était bien accordé.',
      miss: 'Tout le monde trébuche parfois. Le prochain enclos est à toi.',
      beaten: 'Je m’assieds dans l’herbe. Tout s’accorde, tu as gagné.',
    },
    challenge: 'Le Taureau de terre frappe le sol : « Ici, tout s’accorde ou tout s’écroule. À toi de jouer. »',
    icon: 'wheat',
    creature: {
      name: 'Bloquette',
      species: 'vache carrée',
      greeting: 'Meuh ! À la ferme, tout doit s’accorder. Trie bien les graines et je remplis tes sacs de terre.',
      lines: [
        'Meuh. Les vaches, au pluriel, prennent un s. Comme les murs.',
        'Mon étable, c’est de la terre et quatre poteaux de bois.',
        'Quand tout s’accorde, ça tient debout.',
      ],
      home: 'Meuh ! Mon étable est debout. Je dors au chaud, merci bâtisseur·se.',
    },
    exercises: [
      { id: 'enclos', title: 'Enclos', description: 'Glisse les sujets vers le bon verbe : singulier ou pluriel.' },
      { id: 'graines', title: 'Tri des graines', description: 'Phrases à trous : a/à, et/est, on/ont, son/sont, ce/se.' },
      { id: 'recolte', title: 'Récolte -é / -er / -ez', description: 'Clique la bonne terminaison.' },
    ],
  },
  {
    id: 'tour',
    name: 'Tour du lecteur',
    module: 'Fluence de lecture',
    description: 'Lire à voix haute, étage par étage.',
    block: 'verre',
    guardian: 'la Chouette de verre',
    guardianSays: {
      hit: 'Hou… Tu lis mieux que je ne vois la nuit.',
      miss: 'Lire lentement, c’est lire quand même. Reprends ton souffle.',
      beaten: 'Hou hou. Le phare est à toi. Je te confie la nuit.',
    },
    challenge: 'La Chouette de verre cligne des yeux : « Lis-moi, à ton rythme. Le phare t’attend en haut. »',
    icon: 'castle',
    creature: {
      name: 'Grimoire',
      species: 'hibou de pierre',
      greeting: 'Hou hou. Chaque paragraphe que tu lis construit un étage de ma tour. Prends ton temps, je ne compte pas les secondes à voix haute.',
      lines: ['Hou hou. La nuit, mon phare guide les lecteurs.', 'Du verre pour le phare : lis-moi une page.', 'Lire lentement, c’est lire quand même.'],
      home: 'Hou hou ! Mon phare est allumé. Regarde-le briller ce soir.',
    },
    exercises: [{ id: 'ascension', title: 'Ascension', description: 'Lis un texte court, un paragraphe = un étage.' }],
  },
];

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}

