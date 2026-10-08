// Produit par `npm run contenu` depuis docs/contenu/<île>.md, dans l'ordre de docs/contenu/archipel.md : ne pas éditer.
import type { BiomeDef } from './biomes';

export const ILES = [
  {
    "id": "french-6e-phonology",
    "name": "Forêt des sons",
    "module": "Conscience phonologique",
    "subject": "french",
    "classe": "6e",
    "description": "Écouter, couper en syllabes, repérer les sons et les rimes.",
    "block": "french-6e-phonology",
    "guardian": "le Grand Chêne",
    "icon": "tree",
    "creature": {
      "name": "Mousso"
    },
    "exercises": [
      {
        "id": "syllables",
        "title": "Abattage syllabique",
        "description": "Tape autant de coups que de syllabes.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "sound-hunt",
        "title": "Chasse au son",
        "description": "Tape les mots où tu entends le son demandé.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "rhymes",
        "title": "Rimes-échelle",
        "description": "Empile les mots qui riment pour monter à la cabane.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      }
    ]
  },
  {
    "id": "french-6e-letter-confusion",
    "name": "Mine des lettres",
    "module": "Confusions de lettres",
    "subject": "french",
    "classe": "6e",
    "description": "b/d, p/q, f/v, ch/j, t/d : ne plus les confondre.",
    "block": "french-6e-letter-confusion",
    "guardian": "le Golem de roche",
    "icon": "pickaxe",
    "creature": {
      "name": "Tunel"
    },
    "exercises": [
      {
        "id": "letter-pairs",
        "title": "Filon",
        "description": "Pioche seulement la lettre cible parmi b, d, p, q.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "sound-discrimination",
        "title": "Oreille du mineur",
        "description": "Écoute le mot, choisis le bon bloc : vin ou fin ?",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      }
    ]
  },
  {
    "id": "french-6e-word-spelling",
    "name": "Carrière des mots",
    "module": "Orthographe lexicale",
    "subject": "french",
    "classe": "6e",
    "description": "Écrire les mots juste, les familles de mots, les mots-outils, le sens des mots.",
    "block": "french-6e-word-spelling",
    "guardian": "la Dune vivante",
    "icon": "mountain",
    "creature": {
      "name": "Rouxel"
    },
    "exercises": [
      {
        "id": "missing-letters",
        "title": "Mot troué",
        "description": "Glisse le bloc de lettres qui manque.",
        "programme": [
          "c3.fr.langue.mots-frequents"
        ]
      },
      {
        "id": "word-families",
        "title": "Familles-craft",
        "description": "Assemble préfixe, racine et suffixe.",
        "programme": [
          "c3.fr.langue.derivation-composition",
          "c3.fr.langue.racines",
          "c3.fr.langue.familles-champ-lexical"
        ]
      },
      {
        "id": "sight-words",
        "title": "Coffre à mots",
        "description": "Les mots-outils à réviser, en dictée.",
        "programme": [
          "c3.fr.langue.mots-frequents"
        ]
      },
      {
        "id": "word-forms",
        "title": "Facettes",
        "description": "Trouver un mot de même sens, puis le sens d’un mot selon la phrase.",
        "programme": [
          "c3.fr.langue.synonymie"
        ]
      }
    ]
  },
  {
    "id": "french-6e-grammar-spelling",
    "name": "Ferme des accords",
    "module": "Orthographe grammaticale",
    "subject": "french",
    "classe": "6e",
    "description": "Accorder sujet et verbe, accorder dans le groupe nominal, choisir a/à, et/est, -é/-er.",
    "block": "french-6e-grammar-spelling",
    "guardian": "le Taureau de terre",
    "icon": "wheat",
    "creature": {
      "name": "Bloquette"
    },
    "exercises": [
      {
        "id": "word-classes",
        "title": "Enclos",
        "description": "Glisse les sujets vers le bon verbe : singulier ou pluriel.",
        "programme": [
          "c3.fr.langue.accord-sujet-verbe"
        ]
      },
      {
        "id": "sorting",
        "title": "Tri des graines",
        "description": "Phrases à trous : a/à, et/est, on/ont, son/sont, ce/se.",
        "programme": [
          "c3.fr.langue.orthographe-grammaticale"
        ]
      },
      {
        "id": "e-er-ez",
        "title": "Récolte -é / -er / -ez",
        "description": "Clique la bonne terminaison.",
        "programme": [
          "c3.fr.langue.finales-en-e"
        ]
      },
      {
        "id": "plurals",
        "title": "Troupeau",
        "description": "Accorder le déterminant, le nom et l’adjectif, puis trouver le sujet placé après le verbe ou fait de deux noms.",
        "programme": [
          "c3.fr.langue.genre-nombre",
          "c3.fr.langue.sujet"
        ]
      }
    ]
  },
  {
    "id": "french-6e-reading",
    "name": "Tour du lecteur",
    "module": "Lecture et grammaire",
    "subject": "french",
    "classe": "6e",
    "description": "Lire à voix haute, étage par étage, savoir de qui ou de quoi parle un texte, et analyser la phrase.",
    "block": "french-6e-reading",
    "guardian": "la Chouette de verre",
    "icon": "castle",
    "creature": {
      "name": "Grimoire"
    },
    "exercises": [
      {
        "id": "fluency",
        "title": "Ascension",
        "description": "Lis un texte court, un paragraphe = un étage.",
        "programme": [
          "c3.fr.lecture.fluidite"
        ]
      },
      {
        "id": "comprehension",
        "title": "Étages du sens",
        "description": "Lis un texte court et trouve de qui ou de quoi il parle.",
        "programme": [
          "c3.fr.lecture.reprises",
          "c3.fr.lecture.explicite"
        ]
      },
      {
        "id": "sentence-order",
        "title": "Vitraux des phrases",
        "description": "Lis une phrase courte : trouve son type, la fonction d’un mot, ou comment ses propositions sont reliées.",
        "programme": [
          "c3.fr.langue.types-formes",
          "c3.fr.langue.attribut-gn",
          "c3.fr.langue.phrase-complexe"
        ]
      }
    ]
  },
  {
    "id": "maths-6e-calculation",
    "name": "Plaine des nombres",
    "module": "Calcul et problèmes",
    "subject": "maths",
    "classe": "6e",
    "description": "Tables, compléments, doubles et moitiés, puis les problèmes du port, avec des aides visuelles toujours affichées.",
    "block": "maths-6e-calculation",
    "guardian": "le Hanneton de bronze",
    "icon": "calculator",
    "creature": {
      "name": "Coco"
    },
    "exercises": [
      {
        "id": "times-tables",
        "title": "Champ des tables",
        "description": "Une multiplication, et la grille de points pour la voir.",
        "programme": [
          "c3.ma.nombres.faits-numeriques"
        ]
      },
      {
        "id": "make-ten",
        "title": "Pont de dix",
        "description": "Trouve ce qui manque pour arriver à 10 ou à 100.",
        "programme": [
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "doubles-halves",
        "title": "Doubles et moitiés",
        "description": "Le double ou la moitié d’un nombre, en deux étapes.",
        "programme": [
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "word-problems",
        "title": "Carnet du passeur",
        "description": "Un pont, un quai, une traversée : lis le schéma, puis calcule la longueur, le tour ou l’heure.",
        "programme": [
          "c3.ma.nombres.problemes",
          "c3.ma.grandeurs.perimetre",
          "c3.ma.grandeurs.durees"
        ]
      }
    ]
  },
  {
    "id": "maths-6e-fractions",
    "name": "Rivière des fractions",
    "module": "Fractions",
    "subject": "maths",
    "classe": "6e",
    "description": "Lire, comparer et partager des fractions, puis poser les opérations et la division, toujours avec la figure sous les yeux.",
    "block": "maths-6e-fractions",
    "guardian": "le Brochet d’argent",
    "icon": "pizza",
    "creature": {
      "name": "Nénu"
    },
    "exercises": [
      {
        "id": "number-line",
        "title": "Nénuphars",
        "description": "Quelle fraction de la figure est coloriée ? Puis sur la droite.",
        "programme": [
          "c3.ma.nombres.fractions-designations"
        ]
      },
      {
        "id": "equivalence",
        "title": "Deux rives",
        "description": "Compare deux fractions avec les barres sous les yeux.",
        "programme": [
          "c3.ma.nombres.fractions-comparer"
        ]
      },
      {
        "id": "sharing",
        "title": "Partage du gâteau",
        "description": "Une fraction d’une quantité, puis des fractions égales.",
        "programme": [
          "c3.ma.nombres.fractions-designations",
          "c3.ma.nombres.fractions-comparer"
        ]
      },
      {
        "id": "place-value",
        "title": "Galets en colonnes",
        "description": "Pose l’opération, puis la division : partage en parts égales et trouve ce qui reste.",
        "programme": [
          "c3.ma.nombres.calcul-pose"
        ]
      }
    ]
  },
  {
    "id": "maths-6e-decimals",
    "name": "Volcan des décimaux",
    "module": "Nombres décimaux",
    "subject": "maths",
    "classe": "6e",
    "description": "Lire, comparer et placer des nombres à virgule, puis les grands nombres, le tableau de numération toujours affiché.",
    "block": "maths-6e-decimals",
    "guardian": "le Dragon de cendre",
    "icon": "flame",
    "creature": {
      "name": "Lavi"
    },
    "exercises": [
      {
        "id": "ordering",
        "title": "Cratère des rangs",
        "description": "Quel est le chiffre des dixièmes ? Puis la fraction décimale.",
        "programme": [
          "c3.ma.nombres.decimaux-ecritures",
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "operations",
        "title": "Coulée de lave",
        "description": "Compare deux décimaux, puis range-les et trouve un nombre entre deux, tableau sous les yeux.",
        "programme": [
          "c3.ma.nombres.decimaux-comparer"
        ]
      },
      {
        "id": "scale",
        "title": "Pente graduée",
        "description": "Repère un décimal sur la droite, complète jusqu’à 1, puis encadre une fraction entre deux entiers.",
        "programme": [
          "c3.ma.nombres.decimaux-comparer",
          "c3.ma.nombres.calcul-mental",
          "c3.ma.nombres.fractions-comparer"
        ]
      },
      {
        "id": "large-numbers",
        "title": "Nombres géants",
        "description": "Lis et écris les grands nombres, classe par classe, jusqu’aux milliards.",
        "programme": [
          "c3.ma.nombres.grands-entiers"
        ]
      }
    ]
  },
  {
    "id": "maths-5e-signed-numbers",
    "name": "Glacier des relatifs",
    "module": "Nombres relatifs et fractions",
    "subject": "maths",
    "classe": "5e",
    "description": "Comparer, additionner et soustraire des nombres négatifs, la droite sous les yeux, puis des fractions.",
    "block": "maths-5e-signed-numbers",
    "guardian": "le Mammouth de givre",
    "icon": "mountain",
    "creature": {
      "name": "Frimas"
    },
    "exercises": [
      {
        "id": "thermometer",
        "title": "Thermomètre",
        "description": "Compare deux relatifs, puis lis un point sur la droite.",
        "programme": [
          "c4.ma.5e.nombres.relatifs",
          "c4.ma.5e.geometrie.reperage"
        ]
      },
      {
        "id": "adding",
        "title": "Banquise",
        "description": "Additionne et soustrais des relatifs avec le bond sur la droite.",
        "programme": [
          "c4.ma.5e.nombres.calcul-relatifs"
        ]
      },
      {
        "id": "fractions",
        "title": "Icebergs des fractions",
        "description": "Compare, puis additionne et soustrais des fractions : la règle reste affichée.",
        "programme": [
          "c4.ma.5e.nombres.fractions",
          "c4.ma.5e.nombres.calcul-fractions"
        ]
      }
    ]
  },
  {
    "id": "maths-5e-proportionality",
    "name": "Marché des proportions",
    "module": "Proportionnalité",
    "subject": "maths",
    "classe": "5e",
    "description": "Tableaux de proportionnalité, pourcentages, vitesses et échelles, avec le tableau ou le schéma toujours affiché.",
    "block": "maths-5e-proportionality",
    "guardian": "le Colporteur",
    "icon": "ruler",
    "creature": {
      "name": "Bazar"
    },
    "exercises": [
      {
        "id": "proportion-tables",
        "title": "Étals",
        "description": "Complète un tableau de proportionnalité, en passant par l’unité, puis par le coefficient.",
        "programme": [
          "c4.ma.5e.proportionnalite.proportionnalite",
          "c3.ma.proportionnalite.proportionnalite"
        ]
      },
      {
        "id": "percentages",
        "title": "Remises",
        "description": "Prends un pourcentage, puis applique une hausse ou une baisse.",
        "programme": [
          "c4.ma.5e.proportionnalite.pourcentages",
          "c3.ma.nombres.pourcentages"
        ]
      },
      {
        "id": "ratios",
        "title": "Balances",
        "description": "Vitesses constantes et échelles de carte, puis la carte de l’archipel, en mots ou en fraction, puis une traversée : la distance, la vitesse ou la durée, les minutes changées en heures.",
        "programme": [
          "c4.ma.5e.proportionnalite.proportionnalite",
          "c3.ma.proportionnalite.echelle"
        ]
      }
    ]
  },
  {
    "id": "french-5e-homophones",
    "name": "Carrefour des homophones",
    "module": "Homophones grammaticaux",
    "subject": "french",
    "classe": "5e",
    "description": "Des mots qui se disent pareil : choisis le bon, la règle sous les yeux.",
    "block": "french-5e-homophones",
    "guardian": "le Sphinx des routes",
    "icon": "compass",
    "creature": {
      "name": "Sema"
    },
    "exercises": [
      {
        "id": "pairs",
        "title": "Panneaux",
        "description": "Deux mots qui se disent pareil : choisis le bon.",
        "programme": [
          "c4.fr.5e.vocabulaire.orthographe",
          "c4.fr.5e.grammaire.classes-de-mots",
          "c3.fr.langue.orthographe-grammaticale"
        ]
      },
      {
        "id": "choices",
        "title": "Aiguillage",
        "description": "Le bon mot dans la phrase, la règle sous les yeux.",
        "programme": [
          "c4.fr.5e.vocabulaire.orthographe",
          "c4.fr.5e.grammaire.classes-de-mots",
          "c4.fr.5e.grammaire.accords",
          "c3.fr.langue.orthographe-grammaticale"
        ]
      },
      {
        "id": "homophone-sentences",
        "title": "Bifurcation",
        "description": "Deux trous dans la phrase : choisis la bonne paire de mots.",
        "programme": [
          "c4.fr.5e.vocabulaire.orthographe",
          "c4.fr.5e.grammaire.classes-de-mots",
          "c3.fr.langue.orthographe-grammaticale"
        ]
      }
    ]
  },
  {
    "id": "french-5e-conjugation",
    "name": "Marais des temps",
    "module": "Conjugaison",
    "subject": "french",
    "classe": "5e",
    "description": "Imparfait, passé composé, passé simple, futur, conditionnel : reconnaître et choisir le bon temps, la règle affichée.",
    "block": "french-5e-conjugation",
    "guardian": "l’Hydre des marais",
    "icon": "footprints",
    "creature": {
      "name": "Kroa"
    },
    "exercises": [
      {
        "id": "past-tenses",
        "title": "Rives du passé",
        "description": "Imparfait ou passé composé, puis le passé simple du récit.",
        "programme": [
          "c4.fr.5e.grammaire.temps-modes",
          "c3.fr.langue.temps-a-memoriser"
        ]
      },
      {
        "id": "future-tense",
        "title": "Brume du futur",
        "description": "Futur ou conditionnel, puis les formes du futur.",
        "programme": [
          "c4.fr.5e.grammaire.formes-verbales",
          "c3.fr.langue.temps-a-memoriser"
        ]
      },
      {
        "id": "tense-recognition",
        "title": "Reflets",
        "description": "Reconnais le temps d’un verbe, puis son mode : indicatif ou impératif. Le tableau des temps est sous les yeux.",
        "programme": [
          "c4.fr.5e.grammaire.temps-modes",
          "c4.fr.5e.grammaire.formes-verbales",
          "c3.fr.langue.reconnaitre-verbe"
        ]
      },
      {
        "id": "tense-choice",
        "title": "Gué des temps",
        "description": "Le présent et l’impératif, puis le plus-que-parfait et le futur antérieur, puis ce que dit chaque temps.",
        "programme": [
          "c4.fr.5e.grammaire.temps-modes",
          "c4.fr.5e.grammaire.formes-verbales",
          "c3.fr.langue.temps-a-memoriser"
        ]
      }
    ]
  },
  {
    "id": "maths-4e-powers",
    "name": "Forge des puissances",
    "module": "Puissances et racines",
    "subject": "maths",
    "classe": "4e",
    "description": "Puissances, notation scientifique, racines carrées, nombres premiers, puis multiplier et diviser des relatifs et des fractions.",
    "block": "maths-4e-powers",
    "guardian": "le Titan d’acier",
    "icon": "zap",
    "creature": {
      "name": "Braise"
    },
    "exercises": [
      {
        "id": "powers",
        "title": "Étincelles",
        "description": "Puissances de 10, puis notation scientifique.",
        "programme": [
          "c4.ma.a.puissances",
          "c4.ma.a.ecritures-ordres-de-grandeur"
        ]
      },
      {
        "id": "square-roots",
        "title": "Enclume",
        "description": "Puissances d’un nombre, puis produits et quotients de puissances.",
        "programme": [
          "c4.ma.a.puissances"
        ]
      },
      {
        "id": "scientific-notation",
        "title": "Trempe",
        "description": "Racines carrées, puis diviseurs et nombres premiers, puis décomposition en facteurs premiers.",
        "programme": [
          "c4.ma.a.carres-racine",
          "c4.ma.a.divisibilite-premiers",
          "c4.ma.5e.nombres.divisibilite"
        ]
      },
      {
        "id": "subtracting",
        "title": "Fourneau",
        "description": "Multiplie et divise des relatifs avec la règle des signes affichée, puis des fractions.",
        "programme": [
          "c4.ma.a.calcul-relatifs",
          "c4.ma.a.calcul-fractions"
        ]
      }
    ]
  },
  {
    "id": "maths-4e-algebra",
    "name": "Atelier du calcul littéral",
    "module": "Calcul littéral et équations",
    "subject": "maths",
    "classe": "4e",
    "description": "Réduire, développer, résoudre une équation : les lettres comme des blocs, la règle affichée.",
    "block": "maths-4e-algebra",
    "guardian": "le Golem des équations",
    "icon": "ruler",
    "creature": {
      "name": "Ixe"
    },
    "exercises": [
      {
        "id": "simplifying",
        "title": "Réduire",
        "description": "Regroupe les x et les nombres.",
        "programme": [
          "c4.ma.a.reduire-developper"
        ]
      },
      {
        "id": "expanding",
        "title": "Développer",
        "description": "Distributivité simple, puis double, puis factoriser.",
        "programme": [
          "c4.ma.a.reduire-developper"
        ]
      },
      {
        "id": "equations",
        "title": "Équilibre",
        "description": "Équations du premier degré, en une puis deux étapes, puis tester une égalité et les équations produits.",
        "programme": [
          "c4.ma.a.equations"
        ]
      }
    ]
  },
  {
    "id": "french-4e-agreement",
    "name": "Falaise des accords",
    "module": "Accords",
    "subject": "french",
    "classe": "4e",
    "description": "Participe passé, adjectifs, sujet caché, verbes pronominaux : accorder sans se tromper, la règle sous les yeux.",
    "block": "french-4e-agreement",
    "guardian": "le Bélier de granit",
    "icon": "mountain",
    "creature": {
      "name": "Cléa"
    },
    "exercises": [
      {
        "id": "past-participle",
        "title": "Corde du participe",
        "description": "Participe passé avec être, avec avoir, puis avec le COD placé avant.",
        "programme": [
          "c4.fr.langue.participe-passe",
          "c3.fr.langue.attribut-participe-etre"
        ]
      },
      {
        "id": "adjectives",
        "title": "Paroi des adjectifs",
        "description": "Accord de l’adjectif et de l’attribut, puis les couleurs et cas particuliers.",
        "programme": [
          "c4.fr.langue.accord-gn-complexe",
          "c3.fr.langue.accord-gn"
        ]
      },
      {
        "id": "subject-verb",
        "title": "Sommet du sujet",
        "description": "Trouver le sujet : inversé, éloigné, « on », « qui », deux sujets.",
        "programme": [
          "c4.fr.langue.accord-verbe-complexe"
        ]
      },
      {
        "id": "reflexive-verbs",
        "title": "Écho des pronominaux",
        "description": "Les verbes pronominaux, puis l’accord de leur participe passé, puis le groupe apposé.",
        "programme": [
          "c4.fr.langue.morphologie-verbale",
          "c4.fr.langue.participe-passe"
        ]
      }
    ]
  },
  {
    "id": "french-4e-vocabulary",
    "name": "Cabinet des mots",
    "module": "Vocabulaire",
    "subject": "french",
    "classe": "4e",
    "description": "Racines, préfixes et suffixes, sens propre et figuré, synonymes et registres, puis les petits mots qui se disent pareil, et le subjonctif.",
    "block": "french-4e-vocabulary",
    "guardian": "le Hibou lexicographe",
    "icon": "library",
    "creature": {
      "name": "Plume"
    },
    "exercises": [
      {
        "id": "word-roots",
        "title": "Racines",
        "description": "Racines grecques et latines, puis préfixes et suffixes.",
        "programme": [
          "c4.fr.langue.formation-des-mots"
        ]
      },
      {
        "id": "meaning",
        "title": "Sens",
        "description": "Sens propre ou sens figuré, expressions imagées, puis le champ lexical, dans une liste puis dans une phrase.",
        "programme": [
          "c4.fr.langue.sens-des-mots",
          "c4.fr.langue.reseaux-de-mots"
        ]
      },
      {
        "id": "nuances",
        "title": "Nuances",
        "description": "Synonymes, antonymes, registres de langue, le degré d’intensité, puis le registre qui convient à la situation.",
        "programme": [
          "c4.fr.langue.sens-des-mots",
          "c4.fr.langue.reseaux-de-mots",
          "c4.fr.langue.oral-ecrit",
          "c3.fr.langue.synonymie"
        ]
      },
      {
        "id": "conjunctions",
        "title": "Liens",
        "description": "Des petits mots qui se disent pareil, puis le subjonctif après « bien que », « pour que », « avant que ».",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c4.fr.langue.classes-de-mots",
          "c3.fr.langue.classes-de-mots",
          "c4.fr.langue.temps-a-memoriser",
          "c4.fr.langue.morphologie-verbale"
        ]
      }
    ]
  },
  {
    "id": "maths-3e-geometry",
    "name": "Belvédère de Thalès",
    "module": "Géométrie : Pythagore, Thalès, trigonométrie",
    "subject": "maths",
    "classe": "3e",
    "description": "Une longueur manquante dans un triangle rectangle ou une configuration de Thalès, la figure codée sous les yeux ; puis les réciproques : le triangle est-il rectangle, les droites sont-elles parallèles ?",
    "block": "maths-3e-geometry",
    "guardian": "le Sphinx de marbre",
    "icon": "compass",
    "creature": {
      "name": "Théo"
    },
    "exercises": [
      {
        "id": "pythagoras",
        "title": "Pythagore",
        "description": "L’hypoténuse, puis un côté de l’angle droit, puis le câble d’un mât, enfin la réciproque : le triangle est-il rectangle ?",
        "programme": [
          "c4.ma.d.pythagore",
          "c4.ma.a.carres-racine"
        ]
      },
      {
        "id": "thales",
        "title": "Thalès",
        "description": "Une longueur manquante avec deux droites parallèles, puis la hauteur d’un mât ou son ombre, mesurée avec un bâton, enfin la réciproque : les droites sont-elles parallèles ?",
        "programme": [
          "c4.ma.d.thales"
        ]
      },
      {
        "id": "trigonometry",
        "title": "Trigo",
        "description": "Cosinus, sinus ou tangente : le bon rapport.",
        "programme": [
          "c4.ma.d.trigonometrie"
        ]
      }
    ]
  },
  {
    "id": "maths-3e-statistics",
    "name": "Observatoire des données",
    "module": "Statistiques et probabilités",
    "subject": "maths",
    "classe": "3e",
    "description": "Moyenne, médiane, étendue, probabilités, diagrammes et fréquences, puis partager selon un ratio.",
    "block": "maths-3e-statistics",
    "guardian": "le Comptable des étoiles",
    "icon": "star",
    "creature": {
      "name": "Stat"
    },
    "exercises": [
      {
        "id": "mean",
        "title": "Moyenne",
        "description": "La moyenne, puis la médiane et l’étendue d’une petite série.",
        "programme": [
          "c4.ma.b.indicateurs"
        ]
      },
      {
        "id": "probability",
        "title": "Chances",
        "description": "Probabilités simples : sac de boules, dé.",
        "programme": [
          "c4.ma.b.probabilites"
        ]
      },
      {
        "id": "data",
        "title": "Relevés",
        "description": "Lis un diagramme ou un tableau, puis calcule une fréquence, en fraction et en pourcentage.",
        "programme": [
          "c4.ma.b.lire-donnees",
          "c4.ma.b.effectifs-frequences"
        ]
      },
      {
        "id": "ratio-sharing",
        "title": "Cargaisons",
        "description": "Partage une cargaison en deux ou trois parts selon un ratio.",
        "programme": [
          "c4.ma.b.ratio"
        ]
      }
    ]
  },
  {
    "id": "maths-3e-functions",
    "name": "Phare des fonctions",
    "module": "Fonctions",
    "subject": "maths",
    "classe": "3e",
    "description": "Image, antécédent, fonction linéaire ou affine, lecture d’un graphique : le tableau de valeurs ou le graphique toujours affiché.",
    "block": "maths-3e-functions",
    "guardian": "le Dragon de lumière",
    "icon": "lightbulb",
    "creature": {
      "name": "Fi"
    },
    "exercises": [
      {
        "id": "images",
        "title": "Images",
        "description": "L’image d’un nombre, puis son antécédent.",
        "programme": [
          "c4.ma.b.image-antecedent"
        ]
      },
      {
        "id": "linear",
        "title": "Droites",
        "description": "Coefficient directeur, fonction linéaire ou affine.",
        "programme": [
          "c4.ma.b.lineaire-affine"
        ]
      },
      {
        "id": "graphs",
        "title": "Faisceaux",
        "description": "Sur le graphique : une image, un antécédent, puis la droite.",
        "programme": [
          "c4.ma.b.image-antecedent",
          "c4.ma.b.lineaire-affine"
        ]
      }
    ]
  },
  {
    "id": "french-3e-close-reading",
    "name": "Observatoire des textes",
    "module": "Lecture fine et grammaire",
    "subject": "french",
    "classe": "3e",
    "description": "Lire entre les lignes et lire un document, reconnaître les figures de style et les types de phrase, analyser la phrase et ses mots, et savoir qui parle dans un texte.",
    "block": "french-3e-close-reading",
    "guardian": "le Grand Lecteur",
    "icon": "book",
    "creature": {
      "name": "Astra"
    },
    "exercises": [
      {
        "id": "inference",
        "title": "Inférences",
        "description": "Ce que le texte laisse comprendre sans le dire, et lire un court document (menu, horaire, article, mot aux familles).",
        "programme": [
          "c4.fr.lecture.controle",
          "c4.fr.lecture.documents",
          "c3.fr.lecture.implicite"
        ]
      },
      {
        "id": "figures-of-speech",
        "title": "Figures",
        "description": "Figures de style, types et formes de phrase : les reconnaître et dire l’effet qu’ils produisent.",
        "programme": [
          "c4.fr.lecture.procedes",
          "c4.fr.langue.types-formes"
        ]
      },
      {
        "id": "text-connectives",
        "title": "Rouages",
        "description": "Nature et fonction des mots, phrase simple et phrase complexe, connecteurs logiques.",
        "programme": [
          "c4.fr.langue.sujet-complements",
          "c4.fr.langue.fonctions-etendues",
          "c4.fr.langue.classes-de-mots",
          "c4.fr.langue.phrase-complexe",
          "c4.fr.langue.coherence-textuelle",
          "c3.fr.langue.nature-fonction",
          "c3.fr.langue.classes-de-mots",
          "c3.fr.langue.complements"
        ]
      },
      {
        "id": "voices",
        "title": "Voix des textes",
        "description": "Qui parle et comment ses paroles sont rapportées, voix active ou passive, subordonnées.",
        "programme": [
          "c4.fr.langue.enonciation",
          "c4.fr.langue.discours-rapporte",
          "c4.fr.langue.passif",
          "c4.fr.langue.subordonnees"
        ]
      }
    ]
  },
  {
    "id": "english-6e-vocabulary",
    "name": "Baie des mots",
    "module": "Vocabulaire et écoute",
    "subject": "english",
    "classe": "6e",
    "description": "Se présenter, compter, dire l’heure, reconnaître un mot à l’oreille : l’anglais de tous les jours.",
    "block": "english-6e-vocabulary",
    "guardian": "le Lion de pierre",
    "icon": "languages",
    "creature": {
      "name": "Robin"
    },
    "exercises": [
      {
        "id": "hello",
        "title": "Hello",
        "description": "Saluer, se présenter, les phrases de la classe.",
        "programme": [
          "c3.en.dialoguer.contact-social",
          "c3.en.ecouter.consignes"
        ]
      },
      {
        "id": "numbers",
        "title": "Numbers",
        "description": "Les nombres (-teen ou -ty ?), l’heure et la date.",
        "programme": [
          "c3.en.culture.vie-quotidienne",
          "c3.en.langue.phonologie",
          "c3.en.langue.phonie-graphie",
          "c3.en.langue.lexique"
        ]
      },
      {
        "id": "first-listening",
        "title": "Ears",
        "description": "Écouter un mot anglais et trouver son sens (house ou horse ?).",
        "programme": [
          "c3.en.ecouter.mots-familiers",
          "c3.en.langue.phonie-graphie"
        ]
      },
      {
        "id": "signs",
        "title": "Signs",
        "description": "Lire une étiquette, une carte d’anniversaire ou un petit texte en anglais, avec son image, et y trouver un détail.",
        "programme": [
          "c3.en.lire.textes-courts",
          "c3.en.lire.mots-isoles",
          "c3.en.culture.vie-quotidienne"
        ]
      }
    ]
  },
  {
    "id": "english-6e-grammar",
    "name": "Horloge des verbes",
    "module": "Grammaire : to be, have, présent simple",
    "subject": "english",
    "classe": "6e",
    "description": "Am, is ou are ; have ou has ; le s de he, she, it : les verbes de base, la règle sous les yeux.",
    "block": "english-6e-grammar",
    "guardian": "le Coucou de bronze",
    "icon": "history",
    "creature": {
      "name": "Tick"
    },
    "exercises": [
      {
        "id": "to-be",
        "title": "To be",
        "description": "Am, is, are ; la négation et la question.",
        "programme": [
          "c3.en.langue.groupe-verbal",
          "c3.en.langue.phrase"
        ]
      },
      {
        "id": "have-got",
        "title": "Have ou has",
        "description": "Have ou has, pour dire ce qu’on a ; puis do et does pour la question et la négation.",
        "programme": [
          "c3.en.langue.groupe-verbal"
        ]
      },
      {
        "id": "present-simple",
        "title": "Présent simple",
        "description": "Le s de he, she, it ; do et does pour la question et la négation.",
        "programme": [
          "c3.en.langue.groupe-verbal",
          "c3.en.langue.phrase"
        ]
      },
      {
        "id": "story",
        "title": "Story time",
        "description": "Écouter une petite histoire en anglais et répondre à une question : qui, où, quand, dans quel ordre.",
        "programme": [
          "c3.en.ecouter.histoire"
        ]
      }
    ]
  },
  {
    "id": "english-5e-vocabulary",
    "name": "Comptoir",
    "module": "Vocabulaire et compréhension",
    "subject": "english",
    "classe": "5e",
    "description": "Faire ses courses, raconter sa journée, comprendre une phrase entendue, lire un panneau ou un horaire : l’anglais du quotidien.",
    "block": "english-5e-vocabulary",
    "guardian": "la Reine du marché",
    "icon": "languages",
    "creature": {
      "name": "Pudding"
    },
    "exercises": [
      {
        "id": "shopping",
        "title": "Shopping",
        "description": "Au magasin : quantités, prix, repas.",
        "programme": [
          "c4.en.5e.interagir.echanges",
          "c4.en.5e.langue.lexique",
          "c3.en.dialoguer.renseignements"
        ]
      },
      {
        "id": "routine",
        "title": "Routine",
        "description": "La journée (get up, have breakfast…) et always, often, never.",
        "programme": [
          "c4.en.5e.langue.verbe",
          "c4.en.5e.culture.quotidien",
          "c3.en.culture.vie-quotidienne"
        ]
      },
      {
        "id": "listening",
        "title": "Listening",
        "description": "Écouter une phrase et trouver son sens.",
        "programme": [
          "c4.en.5e.comprendre.oral-ecrit"
        ]
      },
      {
        "id": "notices",
        "title": "Notices",
        "description": "Lire un panneau, une consigne, un menu ou un horaire, et y trouver ce qu’on cherche.",
        "programme": [
          "c4.en.5e.comprendre.informations-pratiques",
          "c4.en.5e.comprendre.oral-ecrit",
          "c4.en.5e.langue.lexique"
        ]
      }
    ]
  },
  {
    "id": "english-5e-grammar",
    "name": "Manoir du passé",
    "module": "Grammaire : -ing, prétérit, comparatifs",
    "subject": "english",
    "classe": "5e",
    "description": "Ce qui se passe maintenant, ce qui s’est passé hier, et qui est le plus grand : la règle sous les yeux.",
    "block": "english-5e-grammar",
    "guardian": "le Spectre du manoir",
    "icon": "history",
    "creature": {
      "name": "Moustache"
    },
    "exercises": [
      {
        "id": "ing",
        "title": "-ing",
        "description": "Be + -ing (maintenant) ou présent simple (d’habitude).",
        "programme": [
          "c4.en.5e.langue.verbe"
        ]
      },
      {
        "id": "past-simple",
        "title": "Prétérit",
        "description": "Was, were, les verbes en -ed ; did pour la question et la négation.",
        "programme": [
          "c4.en.5e.langue.verbe"
        ]
      },
      {
        "id": "comparatives",
        "title": "Comparatifs",
        "description": "Taller than, the tallest, more… than, better, the best.",
        "programme": [
          "c4.en.5e.langue.groupe-nominal"
        ]
      }
    ]
  },
  {
    "id": "english-4e-comprehension",
    "name": "Théâtre des voix",
    "module": "Compréhension, quantités, prétérit irrégulier",
    "subject": "english",
    "classe": "4e",
    "description": "Répondre à une question entendue, dire combien, raconter au passé : l’anglais sur scène.",
    "block": "english-4e-comprehension",
    "guardian": "le Masque",
    "icon": "languages",
    "creature": {
      "name": "Puck"
    },
    "exercises": [
      {
        "id": "dialogues",
        "title": "Dialogues",
        "description": "Écouter une question et choisir la bonne réponse.",
        "programme": [
          "c4.en.ecouter.intervention-breve",
          "c4.en.dialoguer.reagir",
          "c3.en.dialoguer.reagir"
        ]
      },
      {
        "id": "quantities",
        "title": "Quantités",
        "description": "Some, any, much, many, a few, a little, enough.",
        "programme": [
          "c4.en.langue.groupe-nominal"
        ]
      },
      {
        "id": "irregular-past",
        "title": "Prétérit irrégulier",
        "description": "Went, saw, bought : les verbes irréguliers au passé.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "stories",
        "title": "Stories",
        "description": "Écouter un court récit au passé et suivre qui fait quoi, où, dans quel ordre et pourquoi.",
        "programme": [
          "c4.en.ecouter.recit",
          "c4.en.ecouter.indices"
        ]
      }
    ]
  },
  {
    "id": "english-4e-grammar",
    "name": "Gare du futur",
    "module": "Grammaire : futur, modaux, present perfect",
    "subject": "english",
    "classe": "4e",
    "description": "Ce qui arrivera, ce qu’on peut ou doit faire, ce qu’on a déjà fait : la règle sous les yeux.",
    "block": "english-4e-grammar",
    "guardian": "la Locomotive de fer",
    "icon": "history",
    "creature": {
      "name": "Vapeur"
    },
    "exercises": [
      {
        "id": "future",
        "title": "Futur",
        "description": "Will et be going to.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "modals",
        "title": "Modaux",
        "description": "Can, must, should, have to.",
        "programme": [
          "c4.en.langue.modaux-passif"
        ]
      },
      {
        "id": "present-perfect",
        "title": "Present perfect",
        "description": "Have been, ever, never, already, yet, just.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "traditions",
        "title": "Traditions",
        "description": "Voyager chez les anglophones : leurs fêtes, leurs lieux, leurs héros et leurs légendes, dans un petit document à lire.",
        "programme": [
          "c3.en.culture.reperes",
          "c3.en.culture.imaginaire",
          "c4.en.culture.voyages-rencontres"
        ]
      }
    ]
  },
  {
    "id": "english-3e-comprehension",
    "name": "Studio des ondes",
    "module": "Compréhension, connecteurs, faux amis",
    "subject": "english",
    "classe": "3e",
    "description": "Comprendre un petit texte, relier ses idées, se méfier des faux amis : l’anglais de la radio.",
    "block": "english-3e-comprehension",
    "guardian": "la Grande Antenne",
    "icon": "languages",
    "creature": {
      "name": "Écho"
    },
    "exercises": [
      {
        "id": "understanding",
        "title": "Comprendre",
        "description": "Un petit texte, une question : trouver la réponse, même quand elle n’est pas écrite.",
        "programme": [
          "c4.en.lire.informations",
          "c4.en.lire.recit"
        ]
      },
      {
        "id": "linking-words",
        "title": "Connecteurs",
        "description": "Because, so, but, although, however, unless…",
        "programme": [
          "c4.en.langue.phrase-complexe"
        ]
      },
      {
        "id": "false-friends",
        "title": "Faux amis",
        "description": "Actually, library, sensible : des mots qui ressemblent au français, mais trompent.",
        "programme": [
          "c4.en.langue.lexique"
        ]
      },
      {
        "id": "media",
        "title": "École et médias",
        "description": "L’école au Royaume-Uni (classes, uniforme, lycée) et les médias (programme télé, concert, réseau, podcast) : lire un document inventé.",
        "programme": [
          "c4.en.culture.ecole-societe",
          "c4.en.culture.langages"
        ]
      }
    ]
  },
  {
    "id": "english-3e-grammar",
    "name": "Château des hypothèses",
    "module": "Grammaire : for et since, if, passif",
    "subject": "english",
    "classe": "3e",
    "description": "Depuis quand, et si…, et par qui : les phrases longues de 3e, la règle sous les yeux.",
    "block": "english-3e-grammar",
    "guardian": "le Dragon gallois",
    "icon": "castle",
    "creature": {
      "name": "Knight"
    },
    "exercises": [
      {
        "id": "for-since",
        "title": "For / since",
        "description": "For, since, ago ; present perfect ou prétérit.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "if",
        "title": "If",
        "description": "Si… : le réel (will) et l’imaginaire (would).",
        "programme": [
          "c4.en.langue.phrase-complexe"
        ]
      },
      {
        "id": "passive",
        "title": "Passif",
        "description": "Is spoken, was built, will be shown : be + participe passé.",
        "programme": [
          "c4.en.langue.modaux-passif"
        ]
      }
    ]
  },
  {
    "id": "history-6e-antiquity",
    "name": "Fouille des siècles",
    "module": "Histoire, de la Préhistoire à l’Empire romain",
    "subject": "history-geography",
    "classe": "6e",
    "description": "Des premiers humains aux premiers États, les Grecs, les Romains et les Hébreux, puis l’Empire romain, les chrétiens et la route de la soie : se repérer dans le temps et lire un document.",
    "block": "history-6e-antiquity",
    "guardian": "l’Amphore peinte",
    "icon": "amphora",
    "creature": {
      "name": "Silex"
    },
    "exercises": [
      {
        "id": "early-humans",
        "title": "Premiers humains, premiers États",
        "description": "Les premiers humains, le Néolithique, les premiers États et les premières écritures.",
        "programme": [
          "c3.hg.histoire.debuts-humanite",
          "c3.hg.histoire.neolithique",
          "c3.hg.histoire.premiers-etats",
          "c3.hg.temps.periodes",
          "c3.hg.temps.ordonner",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document"
        ]
      },
      {
        "id": "ancient-peoples",
        "title": "Grecs, Romains et Hébreux",
        "description": "Les cités grecques et Athènes, Rome de la légende à la République, et le Dieu unique des Hébreux.",
        "programme": [
          "c3.hg.histoire.cites-grecques",
          "c3.hg.histoire.rome-mythe",
          "c3.hg.histoire.monotheisme-juif",
          "c3.hg.temps.frise",
          "c3.hg.temps.ordonner",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document"
        ]
      },
      {
        "id": "roman-empire",
        "title": "L’Empire romain et le monde",
        "description": "Les conquêtes et la paix romaine, les premiers chrétiens, la route de la soie et la Chine des Han.",
        "programme": [
          "c3.hg.histoire.empire-romain",
          "c3.hg.histoire.chretiens",
          "c3.hg.histoire.route-de-la-soie",
          "c3.hg.temps.frise",
          "c3.hg.temps.periodes",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document"
        ]
      }
    ]
  },
  {
    "id": "geography-6e-living",
    "name": "Pointe des paysages",
    "module": "Géographie, habiter le monde",
    "subject": "history-geography",
    "classe": "6e",
    "description": "Habiter une métropole, un espace de faible densité, un littoral, et voir où vivent les humains sur la Terre : les mots de la géographie et des documents courts.",
    "block": "geography-6e-living",
    "guardian": "le Castor de glaise",
    "icon": "map-pin-house",
    "creature": {
      "name": "Boussole"
    },
    "exercises": [
      {
        "id": "metropolises",
        "title": "Les métropoles",
        "description": "Les métropoles du monde, leurs quartiers, leurs habitants, et la ville de demain.",
        "programme": [
          "c3.hg.geographie.metropoles",
          "c3.hg.geographie.ville-de-demain",
          "c3.hg.espace.localiser",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document",
          "c3.hg.demarches.cartes"
        ]
      },
      {
        "id": "low-density",
        "title": "Les espaces de faible densité",
        "description": "Les grands espaces agricoles, les déserts, la montagne, le froid et la forêt : habiter là où il y a peu d’habitants.",
        "programme": [
          "c3.hg.geographie.agricole",
          "c3.hg.geographie.contraintes",
          "c3.hg.espace.localiser",
          "c3.hg.espace.situer",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document",
          "c3.hg.demarches.cartes"
        ]
      },
      {
        "id": "inhabited-world",
        "title": "Littoraux et monde habité",
        "description": "Les ports et les plages des littoraux, puis où vivent les humains sur la Terre.",
        "programme": [
          "c3.hg.geographie.littoral-portuaire",
          "c3.hg.geographie.littoral-touristique",
          "c3.hg.geographie.population-mondiale",
          "c3.hg.geographie.occupation",
          "c3.hg.espace.localiser",
          "c3.hg.demarches.lexique",
          "c3.hg.demarches.document",
          "c3.hg.demarches.cartes"
        ]
      }
    ]
  },
  {
    "id": "life-earth-sciences-6e-living-world",
    "name": "Vallée du vivant",
    "module": "Le vivant et la Terre",
    "subject": "life-earth-sciences",
    "classe": "6e",
    "description": "Classer les êtres vivants, se nourrir et grandir, la Terre et ses milieux de vie, avec un document court sous les yeux.",
    "block": "life-earth-sciences-6e-living-world",
    "guardian": "le Cerf des sous-bois",
    "icon": "sprout",
    "creature": {
      "name": "Fougère"
    },
    "exercises": [
      {
        "id": "living-groups",
        "title": "Classer le vivant",
        "description": "Classer les êtres vivants selon ce qu’ils ont, puis lire les fossiles et les liens de parenté.",
        "programme": [
          "c3.sv.vivant.classer",
          "c3.sv.vivant.evolution",
          "c3.sv.demarches.langages"
        ]
      },
      {
        "id": "food-growth",
        "title": "Se nourrir et grandir",
        "description": "Les groupes d’aliments et leur conservation, puis les étapes de la vie d’un animal et d’une plante.",
        "programme": [
          "c3.sv.vivant.alimentation",
          "c3.sv.vivant.developpement",
          "c3.sv.terre.chaines-alimentaires",
          "c3.sv.demarches.observer",
          "c3.sv.demarches.responsable"
        ]
      },
      {
        "id": "planet-earth",
        "title": "La Terre et ses milieux",
        "description": "La Terre dans le système solaire, les volcans, les séismes et le temps qu’il fait, puis les milieux de vie et ce que l’humain y change.",
        "programme": [
          "c3.sv.terre.systeme-solaire",
          "c3.sv.terre.phenomenes",
          "c3.sv.terre.peuplement",
          "c3.sv.terre.environnement",
          "c3.sv.terre.chaines-alimentaires",
          "c3.sv.demarches.responsable"
        ]
      }
    ]
  },
  {
    "id": "physics-chemistry-6e-matter-energy",
    "name": "Laboratoire des éléments",
    "module": "Matière, mouvement, énergie",
    "subject": "physics-chemistry",
    "classe": "6e",
    "description": "Les états de l’eau et les mélanges, décrire un mouvement, lire un signal, mener une expérience, puis l’énergie et le circuit électrique.",
    "block": "physics-chemistry-6e-matter-energy",
    "guardian": "l’Alambic de verre",
    "icon": "lightbulb",
    "creature": {
      "name": "Bulle"
    },
    "exercises": [
      {
        "id": "states-of-matter",
        "title": "États et mélanges",
        "description": "Solide, liquide, gaz et les changements d’état, puis mesurer, dissoudre et séparer.",
        "programme": [
          "c3.pc.matiere.etats",
          "c3.pc.matiere.grandeurs",
          "c3.pc.matiere.melanges",
          "c3.pc.demarches.mesurer",
          "c3.pc.demarches.langages"
        ]
      },
      {
        "id": "motion-signals",
        "title": "Mouvements et signaux",
        "description": "Décrire un mouvement par sa trajectoire et sa vitesse, puis reconnaître un signal et tester une idée par une expérience.",
        "programme": [
          "c3.pc.matiere.mouvements",
          "c3.pc.matiere.signal",
          "c3.pc.demarches.experimenter",
          "c3.pc.demarches.langages"
        ]
      },
      {
        "id": "energy-circuits",
        "title": "Énergie et circuits",
        "description": "Les sources d’énergie et ce qu’en font les objets, puis le circuit électrique et ses règles de sécurité.",
        "programme": [
          "c3.pc.matiere.energie",
          "c3.pc.matiere.circuit",
          "c3.pc.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "technology-6e-objects",
    "name": "Hangar des inventions",
    "module": "Les objets techniques",
    "subject": "technology",
    "classe": "6e",
    "description": "À quoi sert un objet et comment il marche, de quoi il est fait et ce qu’il devient, comment il prend une information et agit, et comment il a changé.",
    "block": "technology-6e-objects",
    "guardian": "l’Automate de laiton",
    "icon": "ruler",
    "creature": {
      "name": "Pince"
    },
    "exercises": [
      {
        "id": "object-function",
        "title": "À quoi ça sert",
        "description": "Le besoin, la fonction d’usage et les éléments d’un objet, puis l’énergie qui le fait marcher et les mouvements qu’il transmet.",
        "programme": [
          "c3.te.objets.fonction",
          "c3.te.objets.fonctionnement",
          "c3.te.demarches.representer"
        ]
      },
      {
        "id": "materials",
        "title": "Les matériaux",
        "description": "Les familles de matériaux et leurs propriétés, puis d’où ils viennent, comment les recycler et comment jeter moins.",
        "programme": [
          "c3.te.objets.materiaux",
          "c3.te.objets.recyclage"
        ]
      },
      {
        "id": "information-networks",
        "title": "L’information et les objets",
        "description": "Les capteurs et les actionneurs d’un objet programmable, chercher et ranger avec le numérique, puis comment les objets ont changé.",
        "programme": [
          "c3.te.objets.information",
          "c3.te.demarches.numerique",
          "c3.te.objets.evolution"
        ]
      }
    ]
  },
  {
    "id": "history-5e-middle-ages",
    "name": "Bourg des chroniques",
    "module": "Histoire, du Moyen Âge aux Temps modernes",
    "subject": "history-geography",
    "classe": "5e",
    "description": "Byzance, l’Empire carolingien et l’islam, les seigneurs, les paysans et les villes de l’Occident féodal, puis les grandes découvertes, la Renaissance, les réformes et le roi absolu : se repérer dans le temps et lire un document.",
    "block": "history-5e-middle-ages",
    "guardian": "le Griffon d’émail",
    "icon": "feather",
    "creature": {
      "name": "Vélin"
    },
    "exercises": [
      {
        "id": "christendoms-islam",
        "title": "Chrétientés et islam",
        "description": "Byzance, l’Empire de Charlemagne, la naissance et l’expansion de l’islam, les croisades : des mondes en contact, du VIe au XIIIe siècle.",
        "programme": [
          "c4.hg.histoire.chretientes-islam",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document"
        ]
      },
      {
        "id": "feudal-west",
        "title": "L’Occident féodal",
        "description": "Les seigneurs et les paysans, la ville et les bourgeois, l’Église et ses cathédrales, le roi de France qui affirme son pouvoir, du XIe au XVe siècle.",
        "programme": [
          "c4.hg.histoire.occident-feodal",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue"
        ]
      },
      {
        "id": "new-worlds",
        "title": "Vers les Temps modernes",
        "description": "Les grandes découvertes, l’Humanisme et la Renaissance, les réformes, du prince de la Renaissance au roi absolu, au XVIe et au XVIIe siècle.",
        "programme": [
          "c4.hg.histoire.europe-xvie-xviie",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document"
        ]
      }
    ]
  },
  {
    "id": "geography-5e-resources",
    "name": "Delta des ressources",
    "module": "Géographie, des ressources pour 8 milliards d’humains",
    "subject": "history-geography",
    "classe": "5e",
    "description": "La population du monde et l’inégal développement, l’énergie, l’eau et l’alimentation à gérer, les risques et le changement climatique : les mots de la géographie et des documents courts.",
    "block": "geography-5e-resources",
    "guardian": "la Libellule de jade",
    "icon": "droplets",
    "creature": {
      "name": "Sillon"
    },
    "exercises": [
      {
        "id": "population",
        "title": "Population et développement",
        "description": "Les naissances, les décès et l’espérance de vie, des populations jeunes et des populations qui vieillissent, et le développement inégal des pays.",
        "programme": [
          "c4.hg.geographie.demographie-developpement",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "resources",
        "title": "Des ressources à gérer",
        "description": "L’énergie, l’eau et l’alimentation : des ressources limitées, à partager, à économiser et à renouveler.",
        "programme": [
          "c4.hg.geographie.ressources",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "risks",
        "title": "Risques et changement climatique",
        "description": "Accidents d’usine, inondations, sécheresses et canicules : prévenir les risques, et s’adapter au changement climatique.",
        "programme": [
          "c4.hg.geographie.risques-changement-global",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.cartes",
          "c4.hg.demarches.raisonner"
        ]
      }
    ]
  },
  {
    "id": "life-earth-sciences-5e-active-planet",
    "name": "Prairie des climats",
    "module": "La planète Terre et l’action humaine",
    "subject": "life-earth-sciences",
    "classe": "5e",
    "description": "La Terre active, ses séismes et ses volcans, la météo et le climat, puis les ressources et ce que l’humain change dans les milieux, avec un document court sous les yeux.",
    "block": "life-earth-sciences-5e-active-planet",
    "guardian": "la Tortue d’ocre",
    "icon": "cloud-sun",
    "creature": {
      "name": "Humus"
    },
    "exercises": [
      {
        "id": "active-earth",
        "title": "La Terre active",
        "description": "Les couches de la Terre, les plaques qui bougent, les séismes et les volcans, puis les risques et comment s’en protéger.",
        "programme": [
          "c4.sv.terre.geologie",
          "c4.sv.demarches.langages",
          "c4.sv.demarches.raisonner"
        ]
      },
      {
        "id": "weather-climate",
        "title": "Météo et climat",
        "description": "Distinguer la météo et le climat, comprendre ce qui fait bouger l’air et l’eau, puis le climat qui change et les risques météo.",
        "programme": [
          "c4.sv.terre.climat",
          "c4.sv.demarches.langages",
          "c4.sv.demarches.raisonner"
        ]
      },
      {
        "id": "human-impact",
        "title": "Ressources et action humaine",
        "description": "Les ressources que l’humain prend dans la nature, celles qui s’épuisent, puis ce qu’il change dans les écosystèmes et les gestes qui les protègent.",
        "programme": [
          "c4.sv.terre.action-humaine",
          "c4.sv.demarches.raisonner",
          "c4.sv.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "physics-chemistry-5e-matter-universe",
    "name": "Saline des mélanges",
    "module": "La matière, de la goutte aux étoiles",
    "subject": "physics-chemistry",
    "classe": "5e",
    "description": "Les molécules et les changements d’état, les corps purs et les mélanges, la masse et le volume, puis l’Univers, le système solaire et ses éléments.",
    "block": "physics-chemistry-5e-matter-universe",
    "guardian": "le Flamant de sel",
    "icon": "scale",
    "creature": {
      "name": "Perle"
    },
    "exercises": [
      {
        "id": "changes-of-state",
        "title": "États et molécules",
        "description": "Les molécules dans un solide, un liquide et un gaz, puis les changements d’état : le palier, la masse qui se conserve, le volume qui change.",
        "programme": [
          "c4.pc.matiere.etats",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "mixtures-density",
        "title": "Mélanges, masse et volume",
        "description": "Corps purs et mélanges, dissoudre et mélanger deux liquides, puis la masse et le volume : ce qui flotte et ce qui coule.",
        "programme": [
          "c4.pc.matiere.etats",
          "c4.pc.demarches.experimenter",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "universe-atoms",
        "title": "L’Univers et ses éléments",
        "description": "Du système solaire aux galaxies, l’année-lumière, puis l’âge de l’Univers, ses éléments et les atomes nés dans les étoiles.",
        "programme": [
          "c4.pc.matiere.univers",
          "c4.pc.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "technology-5e-design",
    "name": "Menuiserie des objets",
    "module": "Design et objets responsables",
    "subject": "technology",
    "classe": "5e",
    "description": "Du besoin au cahier des charges, une solution technique pour chaque fonction, puis la vie d’un objet, de sa fabrication à son recyclage.",
    "block": "technology-5e-design",
    "guardian": "le Cheval à bascule",
    "icon": "drafting-compass",
    "creature": {
      "name": "Rabot"
    },
    "exercises": [
      {
        "id": "specifications",
        "title": "Du besoin au cahier des charges",
        "description": "Le besoin et le problème technique, puis le cahier des charges : fonctions, contraintes et normes.",
        "programme": [
          "c4.te.usages.interactions"
        ]
      },
      {
        "id": "technical-solutions",
        "title": "Une solution pour chaque fonction",
        "description": "Associer une solution technique à chaque fonction, puis choisir la solution qui respecte le cahier des charges.",
        "programme": [
          "c4.te.conception.solutions",
          "c4.te.usages.interactions"
        ]
      },
      {
        "id": "life-cycle",
        "title": "La vie d’un objet",
        "description": "Le cycle de vie d’un objet, de la matière au recyclage, puis l’énergie qu’il consomme et son impact sur la planète.",
        "programme": [
          "c4.te.usages.choisir",
          "c4.te.fonctionnement.materiaux"
        ]
      }
    ]
  },
  {
    "id": "history-4e-revolutions",
    "name": "Imprimerie des révolutions",
    "module": "Histoire, du XVIIIe siècle à la France du XIXe siècle",
    "subject": "history-geography",
    "classe": "4e",
    "description": "Le commerce atlantique et la traite, les Lumières, la Révolution et l’Empire, puis l’industrie, les colonies et la République : se repérer dans le temps et lire un document.",
    "block": "history-4e-revolutions",
    "guardian": "le Paon de faïence",
    "icon": "factory",
    "creature": {
      "name": "Typo"
    },
    "exercises": [
      {
        "id": "enlightenment",
        "title": "Le XVIIIe siècle, Lumières et révolutions",
        "description": "Le commerce atlantique et la traite, les Lumières, la Révolution française et l’Empire.",
        "programme": [
          "c4.hg.histoire.xviiie-revolutions",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue"
        ]
      },
      {
        "id": "industrial-europe",
        "title": "L’Europe et le monde au XIXe siècle",
        "description": "La révolution industrielle, les usines et les ouvriers, puis la colonisation.",
        "programme": [
          "c4.hg.histoire.europe-monde-xixe",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue"
        ]
      },
      {
        "id": "french-society",
        "title": "La France au XIXe siècle",
        "description": "La conquête du suffrage universel, la Troisième République et l’école, la place des femmes.",
        "programme": [
          "c4.hg.histoire.france-xixe",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue",
          "c4.hg.demarches.raisonner"
        ]
      }
    ]
  },
  {
    "id": "geography-4e-globalization",
    "name": "Escale des échanges",
    "module": "Géographie, un monde de villes et d’échanges",
    "subject": "history-geography",
    "classe": "4e",
    "description": "Les villes qui grandissent, les migrants et les touristes, les mers, les ports et les échanges de la mondialisation : les mots de la géographie et des documents courts.",
    "block": "geography-4e-globalization",
    "guardian": "le Poulpe de corail",
    "icon": "container",
    "creature": {
      "name": "Fret"
    },
    "exercises": [
      {
        "id": "urbanization",
        "title": "L’urbanisation du monde",
        "description": "Des villes de plus en plus grandes et nombreuses, leurs quartiers, leurs inégalités.",
        "programme": [
          "c4.hg.geographie.urbanisation",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "mobilities",
        "title": "Les mobilités humaines",
        "description": "Les migrants, les réfugiés et les touristes : ceux qui traversent les frontières, et pourquoi.",
        "programme": [
          "c4.hg.geographie.mobilites",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "globalization",
        "title": "Mers, ports et mondialisation",
        "description": "Les échanges entre les pays du monde, les navires et les conteneurs, les ports, les canaux et les détroits.",
        "programme": [
          "c4.hg.geographie.mondialisation",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.cartes",
          "c4.hg.demarches.raisonner"
        ]
      }
    ]
  },
  {
    "id": "life-earth-sciences-4e-cells-evolution",
    "name": "Source des espèces",
    "module": "Le vivant et son évolution",
    "subject": "life-earth-sciences",
    "classe": "4e",
    "description": "La cellule et la nutrition des plantes et des animaux, la reproduction et les gènes, puis la biodiversité et l’évolution des espèces, avec un document ou une expérience sous les yeux.",
    "block": "life-earth-sciences-4e-cells-evolution",
    "guardian": "la Girafe d’ambre",
    "icon": "flower",
    "creature": {
      "name": "Nectar"
    },
    "exercises": [
      {
        "id": "cells-nutrition",
        "title": "Cellules et nutrition",
        "description": "La cellule, unité du vivant, puis comment les plantes fabriquent leur matière et comment les animaux s’en nourrissent et respirent.",
        "programme": [
          "c4.sv.vivant.nutrition",
          "c4.sv.demarches.langages",
          "c4.sv.demarches.raisonner"
        ]
      },
      {
        "id": "heredity",
        "title": "Reproduction et gènes",
        "description": "Reproduction sexuée et asexuée, les populations qui grandissent ou diminuent, puis les chromosomes, les gènes et l’ADN, qui font de chacun un être unique.",
        "programme": [
          "c4.sv.vivant.genetique",
          "c4.sv.demarches.langages",
          "c4.sv.demarches.raisonner"
        ]
      },
      {
        "id": "species-evolution",
        "title": "Biodiversité et évolution",
        "description": "La biodiversité, les espèces qui apparaissent et disparaissent, les liens de parenté, puis la sélection naturelle qui fait évoluer les espèces.",
        "programme": [
          "c4.sv.vivant.evolution",
          "c4.sv.demarches.raisonner",
          "c4.sv.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "physics-chemistry-4e-signals-circuits",
    "name": "Vigie des signaux",
    "module": "Lumière, son, circuits et réactions",
    "subject": "physics-chemistry",
    "classe": "4e",
    "description": "La lumière et le son qui se propagent, les circuits en série et en dérivation, l’intensité, la tension et la loi d’Ohm, puis les transformations chimiques et leurs atomes.",
    "block": "physics-chemistry-4e-signals-circuits",
    "guardian": "la Cloche de cobalt",
    "icon": "audio-waveform",
    "creature": {
      "name": "Radar"
    },
    "exercises": [
      {
        "id": "light-sound",
        "title": "Lumière et son",
        "description": "La lumière va en ligne droite et très vite ; le son a besoin de matière pour avancer, sa fréquence fait un son aigu ou grave, et un son trop fort abîme l’oreille.",
        "programme": [
          "c4.pc.signaux.lumiere-son",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "electric-circuits",
        "title": "Circuits et loi d’Ohm",
        "description": "Série et dérivation, l’intensité et la tension et leurs lois, la résistance et la loi d’Ohm, et la sécurité.",
        "programme": [
          "c4.pc.energie.circuits",
          "c4.pc.demarches.experimenter",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "chemical-reactions",
        "title": "Transformations chimiques",
        "description": "Reconnaître une transformation chimique, la combustion, les réactifs et les produits, puis les atomes qui se regroupent, la masse qui se conserve et l’équation de réaction.",
        "programme": [
          "c4.pc.matiere.transformations",
          "c4.pc.demarches.experimenter",
          "c4.pc.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "technology-4e-modeling",
    "name": "Bassin des maquettes",
    "module": "Modéliser et simuler",
    "subject": "technology",
    "classe": "4e",
    "description": "Comment un objet reçoit et transforme l’énergie, comment il capte et traite l’information, et ce que dit une simulation.",
    "block": "technology-4e-modeling",
    "guardian": "le Grand-bi d’érable",
    "icon": "workflow",
    "creature": {
      "name": "Manivelle"
    },
    "exercises": [
      {
        "id": "energy-chain",
        "title": "La chaîne d’énergie",
        "description": "Alimenter, distribuer, convertir et transmettre : le chemin de l’énergie dans un objet, puis son schéma.",
        "programme": [
          "c4.te.fonctionnement.energie"
        ]
      },
      {
        "id": "information-chain",
        "title": "La chaîne d’information",
        "description": "Acquérir, traiter et communiquer : capteurs, carte programmable et actionneurs, puis les deux chaînes ensemble.",
        "programme": [
          "c4.te.fonctionnement.information",
          "c4.te.fonctionnement.energie"
        ]
      },
      {
        "id": "simulation",
        "title": "Lire une simulation",
        "description": "Ce qu’est un modèle et une simulation, puis lire un résultat (tableau, courbe) et le comparer au cahier des charges.",
        "programme": [
          "c4.te.conception.valider",
          "c4.te.usages.interactions"
        ]
      }
    ]
  },
  {
    "id": "history-3e-twentieth-century",
    "name": "Kiosque des témoins",
    "module": "Histoire, de 1914 à nos jours",
    "subject": "history-geography",
    "classe": "3e",
    "description": "Les guerres totales en Europe, le monde depuis 1945, puis la République refondée : se repérer dans le temps, lire un document et dire qui parle.",
    "block": "history-3e-twentieth-century",
    "guardian": "la Colombe d’albâtre",
    "icon": "newspaper",
    "creature": {
      "name": "Mémo"
    },
    "exercises": [
      {
        "id": "total-wars",
        "title": "Les guerres totales",
        "description": "L’Europe de 1914 à 1945 : la Première Guerre mondiale, les régimes totalitaires, la Seconde Guerre mondiale, la France défaite et occupée.",
        "programme": [
          "c4.hg.histoire.guerres-totales",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue"
        ]
      },
      {
        "id": "world-since-1945",
        "title": "Le monde depuis 1945",
        "description": "La décolonisation et les nouveaux États, la guerre froide, la construction européenne.",
        "programme": [
          "c4.hg.histoire.monde-depuis-1945",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document"
        ]
      },
      {
        "id": "republic",
        "title": "Une République repensée",
        "description": "Refonder la République de 1944 à 1947, la cinquième République, femmes et hommes dans la société des années 1950 aux années 1980.",
        "programme": [
          "c4.hg.histoire.republique-repensee",
          "c4.hg.temps.reperes",
          "c4.hg.temps.ordonner",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.point-de-vue"
        ]
      }
    ]
  },
  {
    "id": "geography-3e-france",
    "name": "Plateau des territoires",
    "module": "Géographie, la France et l’Union européenne",
    "subject": "history-geography",
    "classe": "3e",
    "description": "Les villes, les espaces productifs et les campagnes de la France, aménager le territoire et l’outre-mer, puis la France dans l’Union européenne et dans le monde : les mots de la géographie et des documents courts.",
    "block": "geography-3e-france",
    "guardian": "le Cerf de lauze",
    "icon": "route",
    "creature": {
      "name": "Jalon"
    },
    "exercises": [
      {
        "id": "territories",
        "title": "Les territoires de la France",
        "description": "Les aires urbaines, les espaces productifs et les espaces de faible densité de la France d’aujourd’hui.",
        "programme": [
          "c4.hg.geographie.dynamiques-france",
          "c4.hg.espace.localiser",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "planning",
        "title": "Aménager le territoire",
        "description": "Pourquoi et comment aménager : répondre aux inégalités entre territoires, et les territoires ultramarins.",
        "programme": [
          "c4.hg.geographie.amenager",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document",
          "c4.hg.demarches.raisonner"
        ]
      },
      {
        "id": "france-eu",
        "title": "La France et l’Union européenne",
        "description": "L’Union européenne, un nouveau territoire de référence, puis la France et l’Europe dans le monde.",
        "programme": [
          "c4.hg.geographie.france-ue",
          "c4.hg.espace.localiser",
          "c4.hg.espace.situer",
          "c4.hg.demarches.lexique",
          "c4.hg.demarches.document"
        ]
      }
    ]
  },
  {
    "id": "life-earth-sciences-3e-human-body",
    "name": "Verger de la santé",
    "module": "Le corps humain et la santé",
    "subject": "life-earth-sciences",
    "classe": "3e",
    "description": "L’effort, le cerveau et le sommeil, la digestion et les défenses contre les microbes, puis la puberté et la reproduction humaine, avec un document ou une expérience sous les yeux.",
    "block": "life-earth-sciences-3e-human-body",
    "guardian": "le Dauphin de turquoise",
    "icon": "apple",
    "creature": {
      "name": "Olive"
    },
    "exercises": [
      {
        "id": "effort-brain",
        "title": "Effort, cerveau et sommeil",
        "description": "Ce que change un effort dans les muscles, le cœur et la respiration, puis le trajet d’un message nerveux, et ce que le sommeil, les écrans, l’alcool et le tabac changent au cerveau.",
        "programme": [
          "c4.sv.corps.effort-nerveux",
          "c4.sv.demarches.langages",
          "c4.sv.demarches.raisonner"
        ]
      },
      {
        "id": "digestion-microbes",
        "title": "Digestion et microbes",
        "description": "Le trajet des aliments et ce qu’ils deviennent, le microbiote, puis les microbes, les défenses du corps, les vaccins, les antiseptiques et les antibiotiques.",
        "programme": [
          "c4.sv.corps.digestion-microbes",
          "c4.sv.demarches.raisonner",
          "c4.sv.demarches.langages"
        ]
      },
      {
        "id": "puberty-reproduction",
        "title": "Puberté et reproduction",
        "description": "Ce qui change à la puberté, les cellules et les organes de la reproduction, puis la fécondation, la grossesse et ce que permet la contraception.",
        "programme": [
          "c4.sv.corps.reproduction",
          "c4.sv.vivant.genetique",
          "c4.sv.demarches.langages"
        ]
      }
    ]
  },
  {
    "id": "physics-chemistry-3e-motion-energy",
    "name": "Tremplin des forces",
    "module": "Mouvement, forces, énergie",
    "subject": "physics-chemistry",
    "classe": "3e",
    "description": "Décrire un mouvement et calculer une vitesse, les forces, le poids et la gravitation, les formes d’énergie, la puissance et le kilowattheure, puis le pH, les acides et les bases.",
    "block": "physics-chemistry-3e-motion-energy",
    "guardian": "le Kangourou de rubis",
    "icon": "gauge",
    "creature": {
      "name": "Virage"
    },
    "exercises": [
      {
        "id": "motion-forces",
        "title": "Mouvements et forces",
        "description": "Décrire un mouvement par rapport à une référence, uniforme, accéléré ou ralenti, calculer une vitesse, puis les forces, le poids, la masse et la gravitation.",
        "programme": [
          "c4.pc.mouvement.decrire",
          "c4.pc.mouvement.forces",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "energy-power",
        "title": "Énergie et puissance",
        "description": "Les formes d’énergie, ce qui les convertit et ce qui se perd en chaleur, puis la puissance électrique, l’énergie consommée et le kilowattheure.",
        "programme": [
          "c4.pc.energie.formes",
          "c4.pc.energie.circuits",
          "c4.pc.demarches.langages"
        ]
      },
      {
        "id": "acids-bases",
        "title": "Acides et bases",
        "description": "Le pH des solutions de tous les jours, acides, neutres et basiques, puis les précautions, la réaction d’un acide avec le fer et le test du gaz qui se forme.",
        "programme": [
          "c4.pc.matiere.acides-bases",
          "c4.pc.matiere.transformations",
          "c4.pc.demarches.experimenter"
        ]
      }
    ]
  },
  {
    "id": "technology-3e-digital",
    "name": "Ruche des réseaux",
    "module": "Informatique, réseaux et société",
    "subject": "technology",
    "classe": "3e",
    "description": "Ce qui compose un réseau et comment les données y voyagent, les objets connectés et les données personnelles, puis lire un programme simple.",
    "block": "technology-3e-digital",
    "guardian": "l’Abeille de topaze",
    "icon": "network",
    "creature": {
      "name": "Navette"
    },
    "exercises": [
      {
        "id": "computer-networks",
        "title": "Le réseau informatique",
        "description": "Les éléments d’un réseau et l’adresse de chaque appareil, puis internet, les protocoles et le stockage des données.",
        "programme": [
          "c4.te.fonctionnement.reseaux",
          "c4.te.usages.numerique"
        ]
      },
      {
        "id": "connected-objects",
        "title": "Objets connectés et données personnelles",
        "description": "Comment les objets évoluent et changent la société, les objets connectés, puis protéger ses données personnelles.",
        "programme": [
          "c4.te.usages.evolution",
          "c4.te.usages.numerique"
        ]
      },
      {
        "id": "algorithms",
        "title": "Lire un programme",
        "description": "Un algorithme et un programme : séquence, boucle et événement, puis condition et variable, dans un programme court à lire.",
        "programme": [
          "c4.te.fonctionnement.programme"
        ]
      }
    ]
  },
  {
    "id": "lv2-5e-introductions",
    "name": "Relais des voyageurs",
    "module": "Se présenter, compter, décrire",
    "subject": "lv2",
    "classe": "5e",
    "description": "Se présenter, compter, parler de sa famille et de son école : les premiers mots du voyage, dans ta deuxième langue.",
    "block": "lv2-5e-introductions",
    "guardian": "la Diligence de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Lina"
    },
    "exercises": [
      {
        "id": "es-greetings",
        "title": "Hola",
        "description": "Se présenter : une question en espagnol, la bonne réponse (ser et tener).",
        "programme": [
          "c4.es.5e.interagir.echanges",
          "c4.es.5e.langue.verbe",
          "c4.es.5e.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-numbers",
        "title": "Números",
        "description": "Les nombres entendus : sesenta ou setenta, doce ou dos ?",
        "programme": [
          "c4.es.5e.comprendre.oral-ecrit",
          "c4.es.5e.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-family",
        "title": "Familia y colegio",
        "description": "La famille, les consignes de la classe, un panneau ; tu ou tú ?",
        "programme": [
          "c4.es.5e.comprendre.oral-ecrit",
          "c4.es.5e.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-articles",
        "title": "El, la, los, las",
        "description": "L’article du nom, au singulier et au pluriel (el día).",
        "programme": [
          "c4.es.5e.langue.groupe-nominal"
        ],
        "lv2": "es"
      },
      {
        "id": "de-greetings",
        "title": "Hallo",
        "description": "Se présenter : une question en allemand, la bonne réponse (sein et haben).",
        "programme": [
          "c4.de.5e.interagir.echanges",
          "c4.de.5e.langue.verbe",
          "c4.de.5e.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-numbers",
        "title": "Zahlen",
        "description": "Les nombres entendus : -zehn ou -zig, 24 ou 42 ?",
        "programme": [
          "c4.de.5e.comprendre.oral-ecrit",
          "c4.de.5e.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-family",
        "title": "Familie und Schule",
        "description": "La famille, les consignes de la classe, un panneau ; schon ou schön ?",
        "programme": [
          "c4.de.5e.comprendre.oral-ecrit",
          "c4.de.5e.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-articles",
        "title": "Der, die, das",
        "description": "L’article du nom, toujours avec sa majuscule (das Mädchen).",
        "programme": [
          "c4.de.5e.langue.groupe-nominal"
        ],
        "lv2": "de"
      }
    ]
  },
  {
    "id": "lv2-4e-daily-life",
    "name": "Jardin des heures",
    "module": "La journée, l’heure, les repas",
    "subject": "lv2",
    "classe": "4e",
    "description": "Dire l’heure, raconter sa journée, lire un horaire ou un menu : une journée au jardin, dans ta deuxième langue.",
    "block": "lv2-4e-daily-life",
    "guardian": "le Soleil de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Muscade"
    },
    "exercises": [
      {
        "id": "es-time",
        "title": "¿Qué hora es?",
        "description": "L’heure entendue : y cuarto, menos cuarto ; puis où est-on, qui parle ?",
        "programme": [
          "c4.es.ecouter.intervention-breve",
          "c4.es.dialoguer.echanges-sociaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-my-day",
        "title": "Mi día",
        "description": "La journée : me levanto, se ducha ; puis e devient ie, o devient ue.",
        "programme": [
          "c4.es.langue.temps-verbaux",
          "c4.es.langue.groupe-nominal",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-timetable",
        "title": "Horarios y menús",
        "description": "Un emploi du temps, un menu, un programme de loisirs : la bonne ligne.",
        "programme": [
          "c4.es.lire.informations",
          "c4.es.culture.ecole-societe",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-ser-estar",
        "title": "Ser, estar, hay",
        "description": "Être (ser ou estar), il y a (hay), puis tener que, poder, querer.",
        "programme": [
          "c4.es.langue.temps-verbaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "de-time",
        "title": "Wie spät ist es?",
        "description": "L’heure entendue : Viertel nach, halb ; puis où est-on, qui parle ?",
        "programme": [
          "c4.de.ecouter.intervention-breve",
          "c4.de.dialoguer.echanges-sociaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-my-day",
        "title": "Mein Tag",
        "description": "La journée : le verbe en deuxième place, puis la particule à la fin.",
        "programme": [
          "c4.de.langue.temps-verbaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-timetable",
        "title": "Stundenplan und Mensa",
        "description": "Un emploi du temps, un menu, un programme de loisirs : la bonne ligne.",
        "programme": [
          "c4.de.lire.informations",
          "c4.de.culture.ecole-societe",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-modals",
        "title": "Ich esse, ich kann",
        "description": "L’accusatif (einen, den), puis können, müssen, wollen.",
        "programme": [
          "c4.de.langue.groupe-nominal",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      }
    ]
  },
  {
    "id": "lv2-3e-travel",
    "name": "Refuge des carnets",
    "module": "Le voyage, le récit, relier ses idées",
    "subject": "lv2",
    "classe": "3e",
    "description": "Raconter un voyage au passé, lire les carnets des voyageurs, comparer, relier deux idées : dans ta deuxième langue.",
    "block": "lv2-3e-travel",
    "guardian": "le Papillon de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Timbre"
    },
    "exercises": [
      {
        "id": "es-past",
        "title": "¿Adónde fuiste?",
        "description": "Le voyage au passé : fui, visitó ; puis hier ou demain, ir a + infinitif.",
        "programme": [
          "c4.es.langue.temps-verbaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-stories",
        "title": "Historias de viaje",
        "description": "Une petite histoire de voyage, puis l’ordre de l’histoire : primero, luego, al final.",
        "programme": [
          "c4.es.lire.recit",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-countries",
        "title": "Países y ciudades",
        "description": "Les documents du voyage, puis comparer : más, menos, tan… como.",
        "programme": [
          "c4.es.culture.voyages-rencontres",
          "c4.es.lire.informations",
          "c4.es.langue.groupe-nominal",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-connectives",
        "title": "Porque, cuando, pero",
        "description": "Relier deux idées, puis les faux amis.",
        "programme": [
          "c4.es.langue.phrase-complexe",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "de-past",
        "title": "Wohin bist du gefahren?",
        "description": "Le Perfekt avec haben, puis haben ou sein.",
        "programme": [
          "c4.de.langue.temps-verbaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-stories",
        "title": "Reisegeschichten",
        "description": "Une petite histoire de voyage, puis l’ordre de l’histoire : zuerst, dann, am Ende.",
        "programme": [
          "c4.de.lire.recit",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-on-the-road",
        "title": "Unterwegs",
        "description": "Mit + datif, puis comparer : größer als, so… wie.",
        "programme": [
          "c4.de.culture.voyages-rencontres",
          "c4.de.lire.informations",
          "c4.de.langue.groupe-nominal",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-connectives",
        "title": "Weil und dass",
        "description": "Weil et dass : le verbe à la fin ; puis les faux amis.",
        "programme": [
          "c4.de.langue.phrase-complexe",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      }
    ]
  }
] satisfies BiomeDef[];
