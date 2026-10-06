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
          "c3.fr.langue.regularites-orthographiques"
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
          "c3.fr.langue.mots-invariables"
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
          "c3.fr.langue.homophonie"
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
    "description": "Comparer et calculer avec des nombres négatifs, la droite sous les yeux, puis avec des fractions.",
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
          "c4.ma.a.relatifs",
          "c4.ma.d.reperage"
        ]
      },
      {
        "id": "adding",
        "title": "Banquise",
        "description": "Additionne et soustrais des relatifs avec le bond sur la droite.",
        "programme": [
          "c4.ma.a.calcul-relatifs"
        ]
      },
      {
        "id": "subtracting",
        "title": "Crevasses",
        "description": "Multiplie et divise avec la règle des signes affichée.",
        "programme": [
          "c4.ma.a.calcul-relatifs"
        ]
      },
      {
        "id": "fractions",
        "title": "Icebergs des fractions",
        "description": "Compare, puis additionne, soustrais, multiplie et divise des fractions : la règle reste affichée.",
        "programme": [
          "c4.ma.a.fractions",
          "c4.ma.a.calcul-fractions"
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
    "description": "Tableaux de proportionnalité, pourcentages, vitesses, échelles et partages, avec le tableau ou le schéma toujours affiché.",
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
        "description": "Complète un tableau de proportionnalité, puis partage une cargaison entre les navires selon un ratio.",
        "programme": [
          "c4.ma.b.proportionnalite",
          "c4.ma.b.ratio",
          "c3.ma.nombres.proportionnalite"
        ]
      },
      {
        "id": "percentages",
        "title": "Remises",
        "description": "Prends un pourcentage, puis applique une hausse ou une baisse.",
        "programme": [
          "c4.ma.b.pourcentages-echelles",
          "c3.ma.nombres.proportionnalite"
        ]
      },
      {
        "id": "ratios",
        "title": "Balances",
        "description": "Vitesses constantes et échelles de carte, puis la carte de l’archipel, en mots ou en fraction, puis une traversée : la distance, la vitesse ou la durée, les minutes changées en heures.",
        "programme": [
          "c4.ma.c.grandeurs-composees",
          "c4.ma.b.pourcentages-echelles",
          "c3.ma.espace.echelle",
          "c4.ma.c.conversions"
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
    "description": "Ses ou ces, quel ou qu’elle, sans ou s’en : choisir le bon mot, la règle sous les yeux.",
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
        "description": "Ses / ces, ou / où, la / là / l’a, leur / leurs, quand, peu, c’est / s’est.",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c3.fr.langue.homophonie"
        ]
      },
      {
        "id": "choices",
        "title": "Aiguillage",
        "description": "Quel / qu’elle, sans / s’en, dans / d’en, ni / n’y, plus tôt / plutôt, mais / mes / met / m’est…",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c3.fr.langue.homophonie"
        ]
      },
      {
        "id": "homophone-sentences",
        "title": "Bifurcation",
        "description": "Deux trous dans la phrase : choisis la bonne paire de mots.",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c3.fr.langue.homophonie"
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
    "description": "Présent, imparfait, passé composé, passé simple, futur, conditionnel, subjonctif : le bon temps, la règle affichée.",
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
          "c3.fr.langue.temps-a-memoriser",
          "c4.fr.langue.valeurs-des-temps"
        ]
      },
      {
        "id": "future-tense",
        "title": "Brume du futur",
        "description": "Futur ou conditionnel, puis les formes du futur.",
        "programme": [
          "c4.fr.langue.temps-a-memoriser",
          "c3.fr.langue.temps-a-memoriser"
        ]
      },
      {
        "id": "subjunctive",
        "title": "Roseaux du subjonctif",
        "description": "Le subjonctif présent, puis reconnaître le temps d’un verbe.",
        "programme": [
          "c4.fr.langue.temps-a-memoriser",
          "c4.fr.langue.morphologie-verbale",
          "c3.fr.langue.reconnaitre-verbe"
        ]
      },
      {
        "id": "tense-choice",
        "title": "Gué des temps",
        "description": "Le présent et l’impératif, puis le plus-que-parfait et le futur antérieur, puis ce que dit chaque temps.",
        "programme": [
          "c4.fr.langue.valeurs-des-temps",
          "c4.fr.langue.temps-a-memoriser",
          "c4.fr.langue.morphologie-verbale",
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
    "description": "Puissances de 10, notation scientifique, puissances, racines carrées, nombres premiers.",
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
          "c3.ma.nombres.divisibilite"
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
    "description": "Racines grecques et latines, préfixes et suffixes, sens propre et figuré, champ lexical, synonymes, registres et intensité.",
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
    "description": "Moyenne, médiane, étendue d’une petite série, probabilités simples, diagrammes et fréquences, les barres sous les yeux.",
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
          "c3.en.langue.phonie-graphie"
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
    "module": "Grammaire : to be, have got, présent simple",
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
        "title": "Have got",
        "description": "Have got ou has got, pour dire ce qu’on a.",
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
          "c4.en.dialoguer.echanges-sociaux",
          "c3.en.dialoguer.renseignements",
          "c4.en.langue.lexique"
        ]
      },
      {
        "id": "routine",
        "title": "Routine",
        "description": "La journée (get up, have breakfast…) et always, often, never.",
        "programme": [
          "c4.en.langue.temps-verbaux",
          "c3.en.culture.vie-quotidienne"
        ]
      },
      {
        "id": "listening",
        "title": "Listening",
        "description": "Écouter une phrase et trouver son sens.",
        "programme": [
          "c4.en.ecouter.intervention-breve"
        ]
      },
      {
        "id": "notices",
        "title": "Notices",
        "description": "Lire un panneau, une consigne, un menu ou un horaire, et y trouver ce qu’on cherche.",
        "programme": [
          "c4.en.lire.consignes-panneaux",
          "c4.en.lire.informations",
          "c4.en.langue.lexique"
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
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "past-simple",
        "title": "Prétérit",
        "description": "Was, were, les verbes en -ed ; did pour la question et la négation.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "comparatives",
        "title": "Comparatifs",
        "description": "Taller than, the tallest, more… than, better, the best.",
        "programme": [
          "c4.en.langue.groupe-nominal",
          "c3.en.langue.groupe-nominal"
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
    "guardian": "le Castor d’argile",
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
          "c4.es.dialoguer.echanges-sociaux",
          "c4.es.langue.temps-verbaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-numbers",
        "title": "Números",
        "description": "Les nombres entendus : sesenta ou setenta, doce ou dos ?",
        "programme": [
          "c4.es.ecouter.intervention-breve",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-family",
        "title": "Familia y colegio",
        "description": "La famille, les consignes de la classe, un panneau ; tu ou tú ?",
        "programme": [
          "c4.es.lire.consignes-panneaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-articles",
        "title": "El, la, los, las",
        "description": "L’article du nom, au singulier et au pluriel (el día).",
        "programme": [
          "c4.es.langue.groupe-nominal"
        ],
        "lv2": "es"
      },
      {
        "id": "de-greetings",
        "title": "Hallo",
        "description": "Se présenter : une question en allemand, la bonne réponse (sein et haben).",
        "programme": [
          "c4.de.dialoguer.echanges-sociaux",
          "c4.de.langue.temps-verbaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-numbers",
        "title": "Zahlen",
        "description": "Les nombres entendus : -zehn ou -zig, 24 ou 42 ?",
        "programme": [
          "c4.de.ecouter.intervention-breve",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-family",
        "title": "Familie und Schule",
        "description": "La famille, les consignes de la classe, un panneau ; schon ou schön ?",
        "programme": [
          "c4.de.lire.consignes-panneaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-articles",
        "title": "Der, die, das",
        "description": "L’article du nom, toujours avec sa majuscule (das Mädchen).",
        "programme": [
          "c4.de.langue.groupe-nominal"
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
