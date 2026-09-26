// Univers Blocland : biomes, blocs et créatures (noms et créatures originaux).
import type { AnyIconName } from '../components/Icon';

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
  | 'textes';
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
      beaten: 'Je m’incline, bâtisseur. La forêt est à toi… et à Mousso.',
    },
    challenge: 'Le Grand Chêne craque : « Tu as bien écouté ma forêt. Montre-moi tout ce que tu sais faire. »',
    icon: 'tree',
    creature: {
      name: 'Mousso',
      species: 'golem de mousse',
      greeting: 'Salut, bâtisseur ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
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
      beaten: 'Je me couche sur la plage. Le chemin est libre, bâtisseur.',
    },
    challenge: 'La Dune vivante siffle : « Chaque mot bien écrit me fait reculer. Écris juste, et je te laisserai passer. »',
    icon: 'mountain',
    creature: {
      name: 'Rouxel',
      species: 'renard cubique',
      greeting: 'Hé, bâtisseur ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt ?',
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
      home: 'Meuh ! Mon étable est debout. Je dors au chaud, merci bâtisseur.',
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
        'Bonjour, bâtisseur ! Dans ma plaine, on calcule avec les yeux : les points, la boîte de dix, la droite. Chaque calcul réussi, c’est de la brique pour le village.',
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
        'Salut, bâtisseur ! Sur mon volcan, la virgule sépare les unités des dixièmes. Regarde le tableau avant de répondre. Chaque nombre lu, c’est de l’obsidienne pour le village.',
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
        'Salut, bâtisseur ! Ici, il fait moins dix. Les nombres négatifs, c’est à gauche de zéro sur la droite. Chaque calcul réussi, c’est de la glace pour le village.',
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
        'Bienvenue au marché, bâtisseur ! Ici tout est proportionnel : deux fois plus de pommes, deux fois plus d’euros. Chaque compte juste, c’est de la toile pour le village.',
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
  {
    id: 'carrefour',
    name: 'Carrefour des homophones',
    module: 'Homophones grammaticaux',
    subject: 'francais',
    classe: '5e',
    description: 'Ses ou ces, quel ou qu’elle, sans ou s’en : choisir le bon mot, la règle sous les yeux.',
    block: 'panneau',
    guardian: 'le Sphinx des routes',
    guardianSays: {
      hit: 'Hmm… Juste. Tu connais le chemin des mots.',
      miss: 'Ce n’est rien : relis la règle sur le panneau, remplace le mot, et reprends.',
      beaten: 'Je m’écarte. Toutes les routes sont à toi… et à Sema.',
    },
    challenge: 'Le Sphinx des routes se dresse : « Tu as lu tous mes panneaux. Montre-moi que tu ne te trompes plus de chemin. »',
    icon: 'compass',
    creature: {
      name: 'Sema',
      species: 'caméléon des panneaux',
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
      { id: 'panneaux', title: 'Panneaux', description: 'Ses / ces, ou / où, la / là / l’a, leur / leurs, quand, peu, c’est / s’est.' },
      { id: 'aiguillage', title: 'Aiguillage', description: 'Quel / qu’elle, sans / s’en, dans / d’en, ni / n’y, plus tôt / plutôt…' },
      { id: 'bifurcation', title: 'Bifurcation', description: 'Deux trous dans la phrase : choisis la bonne paire de mots.' },
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
    guardianSays: {
      hit: 'Sss… Juste. Une de mes têtes s’incline.',
      miss: 'Ce n’est rien : cherche l’indice de temps dans la phrase, et reprends.',
      beaten: 'Sss. Mes trois têtes se taisent. Le marais est à toi… et à Kroa.',
    },
    challenge: 'L’Hydre des marais sort de la vase : « Tu as traversé mes trois eaux. Montre-moi que tu connais le passé, le futur et le doute. »',
    icon: 'footprints',
    creature: {
      name: 'Kroa',
      species: 'triton des roseaux',
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
      { id: 'rives', title: 'Rives du passé', description: 'Imparfait ou passé composé, puis le passé simple du récit.' },
      { id: 'brume', title: 'Brume du futur', description: 'Futur ou conditionnel, puis les formes du futur.' },
      { id: 'roseaux', title: 'Roseaux du subjonctif', description: 'Le subjonctif présent, puis reconnaître le temps d’un verbe.' },
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
    guardianSays: {
      hit: 'Clang ! Juste. Mon armure sonne creux.',
      miss: 'Ce n’est rien : relis la règle, compte les zéros, et reprends.',
      beaten: 'Clang. Tu frappes plus fort que mon marteau. La forge est à toi… et à Braise.',
    },
    challenge: 'Le Titan d’acier lève son marteau : « Tu as chauffé toute ma forge. Montre-moi la puissance de tes calculs. »',
    icon: 'zap',
    creature: {
      name: 'Braise',
      species: 'golem forgeron',
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
      { id: 'etincelles', title: 'Étincelles', description: 'Puissances de 10, puis notation scientifique.' },
      { id: 'enclume', title: 'Enclume', description: 'Puissances d’un nombre, puis produits et quotients de puissances.' },
      { id: 'trempe', title: 'Trempe', description: 'Racines carrées, puis diviseurs et nombres premiers.' },
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
    guardianSays: {
      hit: 'Égal… Juste. Mes deux plateaux sont à niveau.',
      miss: 'Ce n’est rien : fais la même chose des deux côtés, et reprends.',
      beaten: 'Égal. Tu as trouvé tous mes x. L’atelier est à toi… et à Ixe.',
    },
    challenge: 'Le Golem des équations se met en équilibre : « Tu as tracé tous mes plans. Montre-moi que tu sais trouver l’inconnue. »',
    icon: 'ruler',
    creature: {
      name: 'Ixe',
      species: 'robot dessinateur',
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
      { id: 'reduire', title: 'Réduire', description: 'Regroupe les x et les nombres.' },
      { id: 'developper', title: 'Développer', description: 'Distributivité simple, puis double.' },
      { id: 'equilibre', title: 'Équilibre', description: 'Équations du premier degré, en une puis deux étapes.' },
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
    guardianSays: {
      hit: 'Boum… Juste. Mes cornes s’émoussent.',
      miss: 'Ce n’est rien : cherche le sujet, cherche le complément, et reprends.',
      beaten: 'Boum. Tu grimpes plus sûrement que moi. La falaise est à toi… et à Cléa.',
    },
    challenge: 'Le Bélier de granit frappe le rocher : « Tu as gravi toute ma paroi. Montre-moi que tes accords tiennent la corde. »',
    icon: 'mountain',
    creature: {
      name: 'Cléa',
      species: 'chèvre des cimes',
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
      { id: 'corde', title: 'Corde du participe', description: 'Participe passé avec être, avec avoir, puis avec le COD placé avant.' },
      { id: 'paroi', title: 'Paroi des adjectifs', description: 'Accord de l’adjectif et de l’attribut, puis les couleurs et cas particuliers.' },
      { id: 'sommet', title: 'Sommet du sujet', description: 'Trouver le sujet : inversé, éloigné, « on », « qui », deux sujets.' },
    ],
  },
  {
    id: 'cabinet',
    name: 'Cabinet des mots',
    module: 'Vocabulaire',
    subject: 'francais',
    classe: '4e',
    description: 'Racines grecques et latines, préfixes et suffixes, sens propre et figuré, synonymes et registres.',
    block: 'parchemin',
    guardian: 'le Hibou lexicographe',
    guardianSays: {
      hit: 'Hou… Juste. Tu as lu jusqu’à la racine.',
      miss: 'Ce n’est rien : découpe le mot, cherche le petit morceau connu, et reprends.',
      beaten: 'Hou. Tu connais mes mots mieux que mon dictionnaire. Le cabinet est à toi… et à Plume.',
    },
    challenge: 'Le Hibou lexicographe ferme son dictionnaire : « Tu as ouvert tous mes tiroirs. Montre-moi que tu sais démonter les mots. »',
    icon: 'library',
    creature: {
      name: 'Plume',
      species: 'pie collectionneuse',
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
      { id: 'racines', title: 'Racines', description: 'Racines grecques et latines, puis préfixes et suffixes.' },
      { id: 'sens', title: 'Sens', description: 'Sens propre ou sens figuré, expressions imagées.' },
      { id: 'nuances', title: 'Nuances', description: 'Synonymes, antonymes, registres de langue.' },
    ],
  },
  {
    id: 'belvedere',
    name: 'Belvédère de Thalès',
    module: 'Géométrie : Pythagore, Thalès, trigonométrie',
    subject: 'maths',
    classe: '3e',
    description: 'Une longueur manquante dans un triangle rectangle ou une configuration de Thalès, la figure codée sous les yeux.',
    block: 'marbre',
    guardian: 'le Sphinx de marbre',
    guardianSays: {
      hit: 'Hmm… Juste. L’angle droit te salue.',
      miss: 'Ce n’est rien : repère l’hypoténuse, écris l’égalité, et reprends.',
      beaten: 'Je m’incline. Toutes les longueurs sont à toi… et à Théo.',
    },
    challenge: 'Le Sphinx de marbre se redresse : « Tu as mesuré tout mon belvédère. Montre-moi que tu trouves ce qui manque. »',
    icon: 'compass',
    creature: {
      name: 'Théo',
      species: 'héron géomètre',
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
      { id: 'pythagore', title: 'Pythagore', description: 'L’hypoténuse, puis un côté de l’angle droit.' },
      { id: 'thales', title: 'Thalès', description: 'Une longueur manquante avec deux droites parallèles.' },
      { id: 'trigo', title: 'Trigo', description: 'Cosinus, sinus ou tangente : le bon rapport.' },
    ],
  },
  {
    id: 'donnees',
    name: 'Observatoire des données',
    module: 'Statistiques et probabilités',
    subject: 'maths',
    classe: '3e',
    description: 'Moyenne, médiane, étendue d’une petite série, probabilités simples, les barres sous les yeux.',
    block: 'quartz',
    guardian: 'le Comptable des étoiles',
    guardianSays: {
      hit: 'Tic… Juste. Une étoile de plus dans ma colonne.',
      miss: 'Ce n’est rien : range la série, compte les valeurs, et reprends.',
      beaten: 'Tic. Tu comptes les étoiles mieux que moi. L’observatoire est à toi… et à Stat.',
    },
    challenge: 'Le Comptable des étoiles ouvre son grand livre : « Tu as relevé toutes mes séries. Montre-moi que tu sais les résumer. »',
    icon: 'star',
    creature: {
      name: 'Stat',
      species: 'chouette astronome',
      greeting:
        'Hou ! Bienvenue à l’observatoire, bâtisseur. Ici, on résume une série en un seul nombre : la moyenne, la médiane. Et on prévoit avec les probabilités. Chaque calcul juste, c’est du quartz pour le village.',
      lines: [
        'La moyenne : tout additionner, puis partager équitablement.',
        'La médiane coupe la série rangée en deux moitiés.',
        'Mon dôme est en quartz. Chaque calcul en polit une facette.',
      ],
      home: 'Mon dôme de quartz est fini ! En moyenne, un bloc par calcul ; en médiane, pareil.',
    },
    exercises: [
      { id: 'moyenne', title: 'Moyenne', description: 'La moyenne, puis la médiane et l’étendue d’une petite série.' },
      { id: 'chances', title: 'Chances', description: 'Probabilités simples : sac de boules, dé.' },
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
    guardianSays: {
      hit: 'Flash… Juste. Ma lumière trouve son image.',
      miss: 'Ce n’est rien : remplace x par le nombre, calcule, et reprends.',
      beaten: 'Flash. Tu éclaires plus loin que moi. Le phare est à toi… et à Fi.',
    },
    challenge: 'Le Dragon de lumière déploie ses ailes : « Tu as allumé tout mon phare. Montre-moi que tu suis la lumière de x jusqu’à f(x). »',
    icon: 'lightbulb',
    creature: {
      name: 'Fi',
      species: 'lampe de phare vivante',
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
      { id: 'images', title: 'Images', description: 'L’image d’un nombre, puis son antécédent.' },
      { id: 'droites', title: 'Droites', description: 'Coefficient directeur, fonction linéaire ou affine.' },
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
    guardianSays: {
      hit: 'Mmh… Juste. Tu lis ce qui n’est pas écrit.',
      miss: 'Ce n’est rien : relis la phrase, cherche l’indice, et reprends.',
      beaten: 'Je ferme mon livre. L’observatoire est à toi… et à Astra. Tu sais lire, vraiment lire.',
    },
    challenge: 'Le Grand Lecteur lève les yeux de son livre : « Tu as observé tous mes textes. Montre-moi que tu vois ce qu’ils cachent. »',
    icon: 'book',
    creature: {
      name: 'Astra',
      species: 'luciole lectrice',
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
      { id: 'inferences', title: 'Inférences', description: 'Ce que la phrase laisse comprendre sans le dire.' },
      { id: 'figures', title: 'Figures', description: 'Comparaison, métaphore, personnification, hyperbole, litote…' },
      { id: 'rouages', title: 'Rouages', description: 'Nature et fonction des mots, connecteurs logiques.' },
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
