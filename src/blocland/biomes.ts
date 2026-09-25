// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { AnyIconName } from '../components/Icon';

export type BiomeId = 'foret' | 'mine' | 'carriere' | 'ferme' | 'tour';
export type BlockId = 'bois' | 'pierre' | 'sable' | 'terre' | 'verre' | 'or' | 'cristal';

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

export type BlockTexture = 'herbe' | 'terre' | 'pierre' | 'planches' | 'sable' | 'verre' | 'or' | 'cristal' | 'feuilles' | 'tronc' | 'nuage';

export const BLOCKS: Record<BlockId, BlockDef> = {
  bois: { id: 'bois', name: 'Bois', top: '#c29a5f', side: '#9c7a48', texture: 'planches' },
  pierre: { id: 'pierre', name: 'Pierre', top: '#9c9c9c', side: '#7d7d7d', texture: 'pierre' },
  sable: { id: 'sable', name: 'Sable', top: '#e8e0b4', side: '#cfc48f', texture: 'sable' },
  terre: { id: 'terre', name: 'Terre', top: '#94694a', side: '#6e4a2e', texture: 'terre' },
  verre: { id: 'verre', name: 'Verre', top: '#d6f2f8', side: '#a9dbe6', texture: 'verre' },
  or: { id: 'or', name: 'Or', top: '#f2c944', side: '#cfa326', texture: 'or', rare: true },
  cristal: { id: 'cristal', name: 'Cristal', top: '#8ff0e8', side: '#4fc3bb', texture: 'cristal', rare: true },
};

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
}

export interface BiomeDef {
  id: BiomeId;
  name: string;
  module: string;
  description: string;
  block: BlockId;
  icon: AnyIconName;
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
    icon: 'tree',
    creature: {
      name: 'Mousso',
      species: 'golem de mousse',
      greeting: 'Salut, bâtisseur·se ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
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
    icon: 'pickaxe',
    creature: {
      name: 'Tunel',
      species: 'taupe cubique',
      greeting: 'Bienvenue dans ma mine ! Ici, les lettres se ressemblent, mais mon œil ne se trompe jamais. Pioche les bonnes, je te donne de la pierre.',
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
    icon: 'mountain',
    creature: {
      name: 'Rouxel',
      species: 'renard cubique',
      greeting: 'Hé, bâtisseur·se ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt·e ?',
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
    icon: 'wheat',
    creature: {
      name: 'Bloquette',
      species: 'vache carrée',
      greeting: 'Meuh ! À la ferme, tout doit s’accorder. Trie bien les graines et je remplis tes sacs de terre.',
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
    icon: 'castle',
    creature: {
      name: 'Grimoire',
      species: 'hibou de pierre',
      greeting: 'Hou hou. Chaque paragraphe que tu lis construit un étage de ma tour. Prends ton temps, je ne compte pas les secondes à voix haute.',
    },
    exercises: [{ id: 'ascension', title: 'Ascension', description: 'Lis un texte court, un paragraphe = un étage.' }],
  },
];

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}

/** Un biome s'ouvre quand une quête du biome précédent a au moins une étoile (le premier est toujours ouvert). */
export function isBiomeUnlocked(biomeId: BiomeId, progress: Record<string, { stars: number }>): boolean {
  const index = BIOMES.findIndex((b) => b.id === biomeId);
  if (index <= 0) return true;
  const previous = BIOMES[index - 1];
  return Object.entries(progress).some(([id, p]) => id.startsWith(`${previous.id}-`) && p.stars >= 1);
}

export function previousBiome(biomeId: BiomeId): BiomeDef | undefined {
  const index = BIOMES.findIndex((b) => b.id === biomeId);
  return index > 0 ? BIOMES[index - 1] : undefined;
}
