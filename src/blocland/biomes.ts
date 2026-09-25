// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { AnyIconName } from '../components/Icon';

export type BiomeId = 'foret' | 'mine' | 'carriere' | 'ferme' | 'tour' | 'plaine' | 'riviere' | 'volcan' | 'glacier' | 'marche';
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
  | 'or'
  | 'cristal'
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
  brique: { id: 'brique', name: 'Brique', top: '#d98a5a', side: '#b8623a', texture: 'brique' },
  galet: { id: 'galet', name: 'Galet', top: '#a9bccf', side: '#7f96ad', texture: 'galet' },
  obsidienne: { id: 'obsidienne', name: 'Obsidienne', top: '#4a3d5c', side: '#2e2538', texture: 'obsidienne' },
  glace: { id: 'glace', name: 'Glace', top: '#dff4fb', side: '#b6e0ee', texture: 'glace' },
  toile: { id: 'toile', name: 'Toile', top: '#e9d9b8', side: '#c9463f', texture: 'toile' },
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

export type Classe = '6e' | '5e' | '4e' | '3e';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  module: string;
  /** Matière et classe visée (le contenu monte jusqu'à la fin de 3e). */
  subject: 'francais' | 'maths';
  classe: Classe;
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
    subject: 'francais',
    classe: '6e',
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
    subject: 'francais',
    classe: '6e',
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
    subject: 'francais',
    classe: '6e',
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
    subject: 'francais',
    classe: '6e',
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
  {
    id: 'plaine',
    name: 'Plaine des nombres',
    module: 'Calcul mental',
    subject: 'maths',
    classe: '6e',
    description: 'Tables, compléments, doubles et moitiés, avec des aides visuelles toujours affichées.',
    block: 'brique',
    guardian: 'le Hanneton de bronze',
    guardianSays: {
      hit: 'Bzzz… Juste ! Mes ailes de bronze grincent.',
      miss: 'Ce n’est rien : regarde les points, compte par cinq, et recommence.',
      beaten: 'Bzzz. Tu calcules plus vite que mes ailes. La plaine est à toi… et à Coco.',
    },
    challenge: 'Le Hanneton de bronze bourdonne : « Tu as compté toute ma plaine. Montre-moi ce que tu sais calculer. »',
    icon: 'calculator',
    creature: {
      name: 'Coco',
      species: 'coccinelle à dix points',
      greeting:
        'Bonjour, bâtisseur·se ! Dans ma plaine, on calcule avec les yeux : les points, la boîte de dix, la droite. Chaque calcul réussi, c’est de la brique pour le village.',
      lines: [
        'Compte mes points par cinq : deux rangées de cinq, ça fait dix.',
        'Un nombre et son complément font toujours dix. Comme mes deux ailes.',
        'Ma maison est en brique. Chaque calcul en pose une.',
      ],
      home: 'Mon nid de brique est fini ! Il a exactement dix fenêtres, comme mes points.',
    },
    exercises: [
      { id: 'tables', title: 'Champ des tables', description: 'Une multiplication, et la grille de points pour la voir.' },
      { id: 'complements', title: 'Pont de dix', description: 'Trouve ce qui manque pour arriver à 10 ou à 100.' },
      { id: 'doubles', title: 'Doubles et moitiés', description: 'Le double ou la moitié d’un nombre, en deux étapes.' },
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
    guardianSays: {
      hit: 'Plouf ! Juste. Mes écailles frissonnent.',
      miss: 'Ce n’est rien : regarde les parts, compte celles qui sont coloriées, et reprends.',
      beaten: 'Glou. Tu partages mieux que la rivière elle-même. Elle est à toi… et à Nénu.',
    },
    challenge: 'Le Brochet d’argent fend l’eau : « Tu as partagé toute ma rivière. Montre-moi comment tu lis les parts. »',
    icon: 'pizza',
    creature: {
      name: 'Nénu',
      species: 'grenouille des nénuphars',
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
      { id: 'nenuphars', title: 'Nénuphars', description: 'Quelle fraction de la figure est coloriée ? Puis sur la droite.' },
      { id: 'deux-rives', title: 'Deux rives', description: 'Compare deux fractions avec les barres sous les yeux.' },
      { id: 'partage', title: 'Partage du gâteau', description: 'Une fraction d’une quantité, puis des fractions égales.' },
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
    guardianSays: {
      hit: 'Grrr… Exact. Ma fumée se dissipe.',
      miss: 'Ce n’est rien : repère la virgule, puis lis les rangs un par un. Reprends.',
      beaten: 'Grrr. Tu lis les rangs mieux que mes flammes. Le volcan est à toi… et à Lavi.',
    },
    challenge: 'Le Dragon de cendre gronde : « Tu as gravi tout mon volcan. Montre-moi comment tu lis la virgule. »',
    icon: 'flame',
    creature: {
      name: 'Lavi',
      species: 'salamandre de lave',
      greeting:
        'Salut, bâtisseur·se ! Sur mon volcan, la virgule sépare les unités des dixièmes. Regarde le tableau avant de répondre. Chaque nombre lu, c’est de l’obsidienne pour le village.',
      lines: [
        'La virgule, c’est la frontière : à gauche les unités, à droite les dixièmes.',
        'Le plus long n’est pas le plus grand ! 3,5 bat 3,45.',
        'Mon abri est en obsidienne, noire et brillante. Chaque nombre en apporte une.',
      ],
      home: 'Mon abri d’obsidienne est fini ! Il brille comme 1,0 : entier et sans un dixième qui manque.',
    },
    exercises: [
      { id: 'cratere', title: 'Cratère des rangs', description: 'Quel est le chiffre des dixièmes ? Puis la fraction décimale.' },
      { id: 'coulee', title: 'Coulée de lave', description: 'Compare deux décimaux, tableau sous les yeux.' },
      { id: 'pente', title: 'Pente graduée', description: 'Repère un décimal sur la droite, puis complète jusqu’à 1.' },
    ],
  },
  {
    id: 'glacier',
    name: 'Glacier des relatifs',
    module: 'Nombres relatifs',
    subject: 'maths',
    classe: '5e',
    description: 'Comparer, additionner, soustraire, multiplier des nombres négatifs, la droite sous les yeux.',
    block: 'glace',
    guardian: 'le Mammouth de givre',
    guardianSays: {
      hit: 'Brrr… Juste. Mes défenses en tremblent.',
      miss: 'Ce n’est rien : regarde la droite, zéro au milieu, et reprends.',
      beaten: 'Brrr. Tu comptes même sous zéro. Le glacier est à toi… et à Frimas.',
    },
    challenge: 'Le Mammouth de givre barrit : « Tu as traversé toute ma banquise. Montre-moi comment tu comptes sous zéro. »',
    icon: 'mountain',
    creature: {
      name: 'Frimas',
      species: 'pingouin comptable',
      greeting:
        'Salut, bâtisseur·se ! Ici, il fait moins dix. Les nombres négatifs, c’est à gauche de zéro sur la droite. Chaque calcul réussi, c’est de la glace pour le village.',
      lines: [
        'Moins cinq, c’est plus petit que moins deux. Plus on va à gauche, plus il fait froid.',
        'Soustraire, c’est ajouter l’opposé. Comme enlever un manteau.',
        'Mon igloo est en glace. Chaque calcul en taille un bloc.',
      ],
      home: 'Mon igloo est fini ! Dedans il fait plus deux, dehors moins huit.',
    },
    exercises: [
      { id: 'thermometre', title: 'Thermomètre', description: 'Compare deux relatifs, puis lis un point sur la droite.' },
      { id: 'banquise', title: 'Banquise', description: 'Additionne et soustrais des relatifs avec le bond sur la droite.' },
      { id: 'crevasses', title: 'Crevasses', description: 'Multiplie et divise avec la règle des signes affichée.' },
    ],
  },
  {
    id: 'marche',
    name: 'Marché des proportions',
    module: 'Proportionnalité',
    subject: 'maths',
    classe: '5e',
    description: 'Tableaux de proportionnalité, pourcentages, vitesses et échelles, avec le tableau toujours affiché.',
    block: 'toile',
    guardian: 'le Colporteur',
    guardianSays: {
      hit: 'Hé hé… Juste ! Tu sais compter tes sous.',
      miss: 'Ce n’est rien : passe par la valeur d’un seul, et reprends.',
      beaten: 'Hé hé. Tu marchandes mieux que moi. Le marché est à toi… et à Bazar.',
    },
    challenge: 'Le Colporteur pose sa besace : « Tu as fait le tour de mes étals. Montre-moi comment tu fais les comptes. »',
    icon: 'ruler',
    creature: {
      name: 'Bazar',
      species: 'raton laveur marchand',
      greeting:
        'Bienvenue au marché, bâtisseur·se ! Ici tout est proportionnel : deux fois plus de pommes, deux fois plus d’euros. Chaque compte juste, c’est de la toile pour le village.',
      lines: [
        'Trois pommes, six euros. Une pomme ? Passe par un seul, toujours.',
        'Cinquante pour cent, c’est la moitié. Même pour les raisins.',
        'Mon échoppe est en toile. Chaque compte juste en tend un morceau.',
      ],
      home: 'Mon échoppe est montée ! Cent pour cent finie, pas une remise.',
    },
    exercises: [
      { id: 'etals', title: 'Étals', description: 'Complète un tableau de proportionnalité.' },
      { id: 'remises', title: 'Remises', description: 'Prends un pourcentage, puis applique une hausse ou une baisse.' },
      { id: 'balances', title: 'Balances', description: 'Vitesses constantes et échelles de carte.' },
    ],
  },
];

/** Les îles d'une matière, dans l'ordre des classes. */
export function biomesOf(subject: 'francais' | 'maths'): BiomeDef[] {
  const order: Classe[] = ['6e', '5e', '4e', '3e'];
  return BIOMES.filter((b) => b.subject === subject).sort((a, b) => order.indexOf(a.classe) - order.indexOf(b.classe));
}

export function getBiome(id: string | undefined): BiomeDef | undefined {
  return BIOMES.find((b) => b.id === id);
}
