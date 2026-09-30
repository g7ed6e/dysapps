// Produit par `npm run contenu` depuis docs/contenu/<île>.md, dans l'ordre de docs/contenu/archipel.md : ne pas éditer.
import type { BiomeDef } from './biomes';

export const ILES = [
  {
    "id": "foret",
    "name": "Forêt des sons",
    "module": "Conscience phonologique",
    "subject": "francais",
    "classe": "6e",
    "description": "Écouter, couper en syllabes, repérer les sons et les rimes.",
    "block": "bois",
    "guardian": "le Grand Chêne",
    "icon": "tree",
    "creature": {
      "name": "Mousso"
    },
    "exercises": [
      {
        "id": "abattage",
        "title": "Abattage syllabique",
        "description": "Tape autant de coups que de syllabes.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "chasse-son",
        "title": "Chasse au son",
        "description": "Tape les mots où tu entends le son demandé.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "rimes",
        "title": "Rimes-échelle",
        "description": "Empile les mots qui riment pour monter à la cabane.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      }
    ]
  },
  {
    "id": "mine",
    "name": "Mine des lettres",
    "module": "Confusions de lettres",
    "subject": "francais",
    "classe": "6e",
    "description": "b/d, p/q, f/v, ch/j, t/d : ne plus les confondre.",
    "block": "pierre",
    "guardian": "le Golem de roche",
    "icon": "pickaxe",
    "creature": {
      "name": "Tunel"
    },
    "exercises": [
      {
        "id": "filon",
        "title": "Filon",
        "description": "Pioche seulement la lettre cible parmi b, d, p, q.",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      },
      {
        "id": "oreille",
        "title": "Oreille du mineur",
        "description": "Écoute le mot, choisis le bon bloc : vin ou fin ?",
        "programme": [
          "c3.fr.langue.phonemes-graphemes"
        ]
      }
    ]
  },
  {
    "id": "carriere",
    "name": "Carrière des mots",
    "module": "Orthographe lexicale",
    "subject": "francais",
    "classe": "6e",
    "description": "Écrire les mots juste, les familles de mots, les mots-outils.",
    "block": "sable",
    "guardian": "la Dune vivante",
    "icon": "mountain",
    "creature": {
      "name": "Rouxel"
    },
    "exercises": [
      {
        "id": "mot-troue",
        "title": "Mot troué",
        "description": "Glisse le bloc de lettres qui manque.",
        "programme": [
          "c3.fr.langue.regularites-orthographiques"
        ]
      },
      {
        "id": "familles",
        "title": "Familles-craft",
        "description": "Assemble préfixe, racine et suffixe.",
        "programme": [
          "c3.fr.langue.derivation-composition",
          "c3.fr.langue.racines",
          "c3.fr.langue.familles-champ-lexical"
        ]
      },
      {
        "id": "coffre",
        "title": "Coffre à mots",
        "description": "Les mots-outils à réviser, en dictée.",
        "programme": [
          "c3.fr.langue.mots-invariables"
        ]
      }
    ]
  },
  {
    "id": "ferme",
    "name": "Ferme des accords",
    "module": "Orthographe grammaticale",
    "subject": "francais",
    "classe": "6e",
    "description": "Accorder sujet et verbe, choisir a/à, et/est, -é/-er.",
    "block": "terre",
    "guardian": "le Taureau de terre",
    "icon": "wheat",
    "creature": {
      "name": "Bloquette"
    },
    "exercises": [
      {
        "id": "enclos",
        "title": "Enclos",
        "description": "Glisse les sujets vers le bon verbe : singulier ou pluriel.",
        "programme": [
          "c3.fr.langue.accord-sujet-verbe"
        ]
      },
      {
        "id": "graines",
        "title": "Tri des graines",
        "description": "Phrases à trous : a/à, et/est, on/ont, son/sont, ce/se.",
        "programme": [
          "c3.fr.langue.homophonie"
        ]
      },
      {
        "id": "recolte",
        "title": "Récolte -é / -er / -ez",
        "description": "Clique la bonne terminaison.",
        "programme": [
          "c3.fr.langue.finales-en-e"
        ]
      }
    ]
  },
  {
    "id": "tour",
    "name": "Tour du lecteur",
    "module": "Fluence de lecture",
    "subject": "francais",
    "classe": "6e",
    "description": "Lire à voix haute, étage par étage.",
    "block": "verre",
    "guardian": "la Chouette de verre",
    "icon": "castle",
    "creature": {
      "name": "Grimoire"
    },
    "exercises": [
      {
        "id": "ascension",
        "title": "Ascension",
        "description": "Lis un texte court, un paragraphe = un étage.",
        "programme": [
          "c3.fr.lecture.fluidite"
        ]
      }
    ]
  },
  {
    "id": "plaine",
    "name": "Plaine des nombres",
    "module": "Calcul et problèmes",
    "subject": "maths",
    "classe": "6e",
    "description": "Tables, compléments, doubles et moitiés, puis les problèmes du port, avec des aides visuelles toujours affichées.",
    "block": "brique",
    "guardian": "le Hanneton de bronze",
    "icon": "calculator",
    "creature": {
      "name": "Coco"
    },
    "exercises": [
      {
        "id": "tables",
        "title": "Champ des tables",
        "description": "Une multiplication, et la grille de points pour la voir.",
        "programme": [
          "c3.ma.nombres.faits-numeriques"
        ]
      },
      {
        "id": "complements",
        "title": "Pont de dix",
        "description": "Trouve ce qui manque pour arriver à 10 ou à 100.",
        "programme": [
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "doubles",
        "title": "Doubles et moitiés",
        "description": "Le double ou la moitié d’un nombre, en deux étapes.",
        "programme": [
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "passeur",
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
    "id": "riviere",
    "name": "Rivière des fractions",
    "module": "Fractions",
    "subject": "maths",
    "classe": "6e",
    "description": "Lire, comparer et partager des fractions, toujours avec la figure sous les yeux.",
    "block": "galet",
    "guardian": "le Brochet d’argent",
    "icon": "pizza",
    "creature": {
      "name": "Nénu"
    },
    "exercises": [
      {
        "id": "nenuphars",
        "title": "Nénuphars",
        "description": "Quelle fraction de la figure est coloriée ? Puis sur la droite.",
        "programme": [
          "c3.ma.nombres.fractions-designations"
        ]
      },
      {
        "id": "deux-rives",
        "title": "Deux rives",
        "description": "Compare deux fractions avec les barres sous les yeux.",
        "programme": [
          "c3.ma.nombres.fractions-comparer"
        ]
      },
      {
        "id": "partage",
        "title": "Partage du gâteau",
        "description": "Une fraction d’une quantité, puis des fractions égales.",
        "programme": [
          "c3.ma.nombres.fractions-designations",
          "c3.ma.nombres.fractions-comparer"
        ]
      }
    ]
  },
  {
    "id": "volcan",
    "name": "Volcan des décimaux",
    "module": "Nombres décimaux",
    "subject": "maths",
    "classe": "6e",
    "description": "Lire, comparer et placer des nombres à virgule, le tableau de numération toujours affiché.",
    "block": "obsidienne",
    "guardian": "le Dragon de cendre",
    "icon": "flame",
    "creature": {
      "name": "Lavi"
    },
    "exercises": [
      {
        "id": "cratere",
        "title": "Cratère des rangs",
        "description": "Quel est le chiffre des dixièmes ? Puis la fraction décimale.",
        "programme": [
          "c3.ma.nombres.decimaux-ecritures",
          "c3.ma.nombres.calcul-mental"
        ]
      },
      {
        "id": "coulee",
        "title": "Coulée de lave",
        "description": "Compare deux décimaux, tableau sous les yeux.",
        "programme": [
          "c3.ma.nombres.decimaux-comparer"
        ]
      },
      {
        "id": "pente",
        "title": "Pente graduée",
        "description": "Repère un décimal sur la droite, puis complète jusqu’à 1.",
        "programme": [
          "c3.ma.nombres.decimaux-comparer",
          "c3.ma.nombres.calcul-mental"
        ]
      }
    ]
  },
  {
    "id": "glacier",
    "name": "Glacier des relatifs",
    "module": "Nombres relatifs et fractions",
    "subject": "maths",
    "classe": "5e",
    "description": "Comparer et calculer avec des nombres négatifs, la droite sous les yeux, puis avec des fractions.",
    "block": "glace",
    "guardian": "le Mammouth de givre",
    "icon": "mountain",
    "creature": {
      "name": "Frimas"
    },
    "exercises": [
      {
        "id": "thermometre",
        "title": "Thermomètre",
        "description": "Compare deux relatifs, puis lis un point sur la droite.",
        "programme": [
          "c4.ma.a.relatifs",
          "c4.ma.d.reperage"
        ]
      },
      {
        "id": "banquise",
        "title": "Banquise",
        "description": "Additionne et soustrais des relatifs avec le bond sur la droite.",
        "programme": [
          "c4.ma.a.calcul-relatifs"
        ]
      },
      {
        "id": "crevasses",
        "title": "Crevasses",
        "description": "Multiplie et divise avec la règle des signes affichée.",
        "programme": [
          "c4.ma.a.calcul-relatifs"
        ]
      },
      {
        "id": "icebergs",
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
    "id": "marche",
    "name": "Marché des proportions",
    "module": "Proportionnalité",
    "subject": "maths",
    "classe": "5e",
    "description": "Tableaux de proportionnalité, pourcentages, vitesses, échelles et partages, avec le tableau ou le schéma toujours affiché.",
    "block": "toile",
    "guardian": "le Colporteur",
    "icon": "ruler",
    "creature": {
      "name": "Bazar"
    },
    "exercises": [
      {
        "id": "etals",
        "title": "Étals",
        "description": "Complète un tableau de proportionnalité, puis partage une cargaison entre les navires selon un ratio.",
        "programme": [
          "c4.ma.b.proportionnalite",
          "c4.ma.b.ratio",
          "c3.ma.nombres.proportionnalite"
        ]
      },
      {
        "id": "remises",
        "title": "Remises",
        "description": "Prends un pourcentage, puis applique une hausse ou une baisse.",
        "programme": [
          "c4.ma.b.pourcentages-echelles",
          "c3.ma.nombres.proportionnalite"
        ]
      },
      {
        "id": "balances",
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
    "id": "carrefour",
    "name": "Carrefour des homophones",
    "module": "Homophones grammaticaux",
    "subject": "francais",
    "classe": "5e",
    "description": "Ses ou ces, quel ou qu’elle, sans ou s’en : choisir le bon mot, la règle sous les yeux.",
    "block": "panneau",
    "guardian": "le Sphinx des routes",
    "icon": "compass",
    "creature": {
      "name": "Sema"
    },
    "exercises": [
      {
        "id": "panneaux",
        "title": "Panneaux",
        "description": "Ses / ces, ou / où, la / là / l’a, leur / leurs, quand, peu, c’est / s’est.",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c3.fr.langue.homophonie"
        ]
      },
      {
        "id": "aiguillage",
        "title": "Aiguillage",
        "description": "Quel / qu’elle, sans / s’en, dans / d’en, ni / n’y, plus tôt / plutôt…",
        "programme": [
          "c4.fr.langue.orthographe-lexicale",
          "c3.fr.langue.homophonie"
        ]
      },
      {
        "id": "bifurcation",
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
    "id": "marais",
    "name": "Marais des temps",
    "module": "Conjugaison",
    "subject": "francais",
    "classe": "5e",
    "description": "Présent, imparfait, passé composé, passé simple, futur, conditionnel, subjonctif : le bon temps, la règle affichée.",
    "block": "tourbe",
    "guardian": "l’Hydre des marais",
    "icon": "footprints",
    "creature": {
      "name": "Kroa"
    },
    "exercises": [
      {
        "id": "rives",
        "title": "Rives du passé",
        "description": "Imparfait ou passé composé, puis le passé simple du récit.",
        "programme": [
          "c3.fr.langue.temps-a-memoriser",
          "c4.fr.langue.valeurs-des-temps"
        ]
      },
      {
        "id": "brume",
        "title": "Brume du futur",
        "description": "Futur ou conditionnel, puis les formes du futur.",
        "programme": [
          "c4.fr.langue.temps-a-memoriser",
          "c3.fr.langue.temps-a-memoriser"
        ]
      },
      {
        "id": "roseaux",
        "title": "Roseaux du subjonctif",
        "description": "Le subjonctif présent, puis reconnaître le temps d’un verbe.",
        "programme": [
          "c4.fr.langue.temps-a-memoriser",
          "c4.fr.langue.morphologie-verbale",
          "c3.fr.langue.reconnaitre-verbe"
        ]
      },
      {
        "id": "gue",
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
    "id": "forge",
    "name": "Forge des puissances",
    "module": "Puissances et racines",
    "subject": "maths",
    "classe": "4e",
    "description": "Puissances de 10, notation scientifique, puissances, racines carrées, nombres premiers.",
    "block": "acier",
    "guardian": "le Titan d’acier",
    "icon": "zap",
    "creature": {
      "name": "Braise"
    },
    "exercises": [
      {
        "id": "etincelles",
        "title": "Étincelles",
        "description": "Puissances de 10, puis notation scientifique.",
        "programme": [
          "c4.ma.a.puissances",
          "c4.ma.a.ecritures-ordres-de-grandeur"
        ]
      },
      {
        "id": "enclume",
        "title": "Enclume",
        "description": "Puissances d’un nombre, puis produits et quotients de puissances.",
        "programme": [
          "c4.ma.a.puissances"
        ]
      },
      {
        "id": "trempe",
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
    "id": "atelier",
    "name": "Atelier du calcul littéral",
    "module": "Calcul littéral et équations",
    "subject": "maths",
    "classe": "4e",
    "description": "Réduire, développer, résoudre une équation : les lettres comme des blocs, la règle affichée.",
    "block": "calque",
    "guardian": "le Golem des équations",
    "icon": "ruler",
    "creature": {
      "name": "Ixe"
    },
    "exercises": [
      {
        "id": "reduire",
        "title": "Réduire",
        "description": "Regroupe les x et les nombres.",
        "programme": [
          "c4.ma.a.reduire-developper"
        ]
      },
      {
        "id": "developper",
        "title": "Développer",
        "description": "Distributivité simple, puis double, puis factoriser.",
        "programme": [
          "c4.ma.a.reduire-developper"
        ]
      },
      {
        "id": "equilibre",
        "title": "Équilibre",
        "description": "Équations du premier degré, en une puis deux étapes, puis tester une égalité et les équations produits.",
        "programme": [
          "c4.ma.a.equations"
        ]
      }
    ]
  },
  {
    "id": "falaise",
    "name": "Falaise des accords",
    "module": "Accords",
    "subject": "francais",
    "classe": "4e",
    "description": "Participe passé, adjectifs, sujet caché, verbes pronominaux : accorder sans se tromper, la règle sous les yeux.",
    "block": "ardoise",
    "guardian": "le Bélier de granit",
    "icon": "mountain",
    "creature": {
      "name": "Cléa"
    },
    "exercises": [
      {
        "id": "corde",
        "title": "Corde du participe",
        "description": "Participe passé avec être, avec avoir, puis avec le COD placé avant.",
        "programme": [
          "c4.fr.langue.participe-passe",
          "c3.fr.langue.attribut-participe-etre"
        ]
      },
      {
        "id": "paroi",
        "title": "Paroi des adjectifs",
        "description": "Accord de l’adjectif et de l’attribut, puis les couleurs et cas particuliers.",
        "programme": [
          "c4.fr.langue.accord-gn-complexe",
          "c3.fr.langue.accord-gn"
        ]
      },
      {
        "id": "sommet",
        "title": "Sommet du sujet",
        "description": "Trouver le sujet : inversé, éloigné, « on », « qui », deux sujets.",
        "programme": [
          "c4.fr.langue.accord-verbe-complexe"
        ]
      },
      {
        "id": "echo",
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
    "id": "cabinet",
    "name": "Cabinet des mots",
    "module": "Vocabulaire",
    "subject": "francais",
    "classe": "4e",
    "description": "Racines grecques et latines, préfixes et suffixes, sens propre et figuré, champ lexical, synonymes, registres et intensité.",
    "block": "parchemin",
    "guardian": "le Hibou lexicographe",
    "icon": "library",
    "creature": {
      "name": "Plume"
    },
    "exercises": [
      {
        "id": "racines",
        "title": "Racines",
        "description": "Racines grecques et latines, puis préfixes et suffixes.",
        "programme": [
          "c4.fr.langue.formation-des-mots"
        ]
      },
      {
        "id": "sens",
        "title": "Sens",
        "description": "Sens propre ou sens figuré, expressions imagées, puis le champ lexical.",
        "programme": [
          "c4.fr.langue.sens-des-mots",
          "c4.fr.langue.reseaux-de-mots"
        ]
      },
      {
        "id": "nuances",
        "title": "Nuances",
        "description": "Synonymes, antonymes, registres de langue, puis le degré d’intensité.",
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
    "id": "belvedere",
    "name": "Belvédère de Thalès",
    "module": "Géométrie : Pythagore, Thalès, trigonométrie",
    "subject": "maths",
    "classe": "3e",
    "description": "Une longueur manquante dans un triangle rectangle ou une configuration de Thalès, la figure codée sous les yeux ; puis les réciproques : le triangle est-il rectangle, les droites sont-elles parallèles ?",
    "block": "marbre",
    "guardian": "le Sphinx de marbre",
    "icon": "compass",
    "creature": {
      "name": "Théo"
    },
    "exercises": [
      {
        "id": "pythagore",
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
        "id": "trigo",
        "title": "Trigo",
        "description": "Cosinus, sinus ou tangente : le bon rapport.",
        "programme": [
          "c4.ma.d.trigonometrie"
        ]
      }
    ]
  },
  {
    "id": "donnees",
    "name": "Observatoire des données",
    "module": "Statistiques et probabilités",
    "subject": "maths",
    "classe": "3e",
    "description": "Moyenne, médiane, étendue d’une petite série, probabilités simples, diagrammes et fréquences, les barres sous les yeux.",
    "block": "quartz",
    "guardian": "le Comptable des étoiles",
    "icon": "star",
    "creature": {
      "name": "Stat"
    },
    "exercises": [
      {
        "id": "moyenne",
        "title": "Moyenne",
        "description": "La moyenne, puis la médiane et l’étendue d’une petite série.",
        "programme": [
          "c4.ma.b.indicateurs"
        ]
      },
      {
        "id": "chances",
        "title": "Chances",
        "description": "Probabilités simples : sac de boules, dé.",
        "programme": [
          "c4.ma.b.probabilites"
        ]
      },
      {
        "id": "releves",
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
    "id": "phare",
    "name": "Phare des fonctions",
    "module": "Fonctions",
    "subject": "maths",
    "classe": "3e",
    "description": "Image, antécédent, fonction linéaire ou affine, lecture d’un graphique : le tableau de valeurs ou le graphique toujours affiché.",
    "block": "prisme",
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
        "id": "droites",
        "title": "Droites",
        "description": "Coefficient directeur, fonction linéaire ou affine.",
        "programme": [
          "c4.ma.b.lineaire-affine"
        ]
      },
      {
        "id": "faisceaux",
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
    "id": "textes",
    "name": "Observatoire des textes",
    "module": "Lecture fine et grammaire",
    "subject": "francais",
    "classe": "3e",
    "description": "Lire entre les lignes et lire un document, reconnaître les figures de style et les types de phrase, analyser la phrase et ses mots, et savoir qui parle dans un texte.",
    "block": "lentille",
    "guardian": "le Grand Lecteur",
    "icon": "book",
    "creature": {
      "name": "Astra"
    },
    "exercises": [
      {
        "id": "inferences",
        "title": "Inférences",
        "description": "Ce que le texte laisse comprendre sans le dire, et lire un court document (menu, horaire, article, mot aux familles).",
        "programme": [
          "c4.fr.lecture.controle",
          "c4.fr.lecture.documents",
          "c3.fr.lecture.implicite"
        ]
      },
      {
        "id": "figures",
        "title": "Figures",
        "description": "Figures de style, types et formes de phrase : les reconnaître et dire l’effet qu’ils produisent.",
        "programme": [
          "c4.fr.lecture.procedes",
          "c4.fr.langue.types-formes"
        ]
      },
      {
        "id": "rouages",
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
        "id": "voix",
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
    "id": "baie",
    "name": "Baie des mots",
    "module": "Vocabulaire et écoute",
    "subject": "anglais",
    "classe": "6e",
    "description": "Se présenter, compter, dire l’heure, reconnaître un mot à l’oreille : l’anglais de tous les jours.",
    "block": "cabine",
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
        "id": "ears",
        "title": "Ears",
        "description": "Écouter un mot anglais et trouver son sens (house ou horse ?).",
        "programme": [
          "c3.en.ecouter.mots-familiers",
          "c3.en.langue.phonie-graphie"
        ]
      }
    ]
  },
  {
    "id": "horloge",
    "name": "Horloge des verbes",
    "module": "Grammaire : to be, have got, présent simple",
    "subject": "anglais",
    "classe": "6e",
    "description": "Am, is ou are ; have ou has ; le s de he, she, it : les verbes de base, la règle sous les yeux.",
    "block": "cadran",
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
      }
    ]
  },
  {
    "id": "comptoir",
    "name": "Comptoir",
    "module": "Vocabulaire et compréhension",
    "subject": "anglais",
    "classe": "5e",
    "description": "Faire ses courses, raconter sa journée, comprendre une phrase entendue, lire un panneau ou un horaire : l’anglais du quotidien.",
    "block": "tuile",
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
    "id": "manoir",
    "name": "Manoir du passé",
    "module": "Grammaire : -ing, prétérit, comparatifs",
    "subject": "anglais",
    "classe": "5e",
    "description": "Ce qui se passe maintenant, ce qui s’est passé hier, et qui est le plus grand : la règle sous les yeux.",
    "block": "lambris",
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
        "id": "preterit",
        "title": "Prétérit",
        "description": "Was, were, les verbes en -ed ; did pour la question et la négation.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "comparatifs",
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
    "id": "theatre",
    "name": "Théâtre des voix",
    "module": "Compréhension, quantités, prétérit irrégulier",
    "subject": "anglais",
    "classe": "4e",
    "description": "Répondre à une question entendue, dire combien, raconter au passé : l’anglais sur scène.",
    "block": "velours",
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
        "id": "quantites",
        "title": "Quantités",
        "description": "Some, any, much, many, a few, a little, enough.",
        "programme": [
          "c4.en.langue.groupe-nominal"
        ]
      },
      {
        "id": "preterit-irregulier",
        "title": "Prétérit irrégulier",
        "description": "Went, saw, bought : les verbes irréguliers au passé.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      }
    ]
  },
  {
    "id": "gare",
    "name": "Gare du futur",
    "module": "Grammaire : futur, modaux, present perfect",
    "subject": "anglais",
    "classe": "4e",
    "description": "Ce qui arrivera, ce qu’on peut ou doit faire, ce qu’on a déjà fait : la règle sous les yeux.",
    "block": "rail",
    "guardian": "la Locomotive de fer",
    "icon": "history",
    "creature": {
      "name": "Vapeur"
    },
    "exercises": [
      {
        "id": "futur",
        "title": "Futur",
        "description": "Will et be going to.",
        "programme": [
          "c4.en.langue.temps-verbaux"
        ]
      },
      {
        "id": "modaux",
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
      }
    ]
  },
  {
    "id": "studio",
    "name": "Studio des ondes",
    "module": "Compréhension, connecteurs, faux amis",
    "subject": "anglais",
    "classe": "3e",
    "description": "Comprendre un petit texte, relier ses idées, se méfier des faux amis : l’anglais de la radio.",
    "block": "antenne",
    "guardian": "la Grande Antenne",
    "icon": "languages",
    "creature": {
      "name": "Écho"
    },
    "exercises": [
      {
        "id": "comprendre",
        "title": "Comprendre",
        "description": "Un petit texte, une question : trouver la réponse, même quand elle n’est pas écrite.",
        "programme": [
          "c4.en.lire.informations",
          "c4.en.lire.recit"
        ]
      },
      {
        "id": "connecteurs",
        "title": "Connecteurs",
        "description": "Because, so, but, although, however, unless…",
        "programme": [
          "c4.en.langue.phrase-complexe"
        ]
      },
      {
        "id": "faux-amis",
        "title": "Faux amis",
        "description": "Actually, library, sensible : des mots qui ressemblent au français, mais trompent.",
        "programme": [
          "c4.en.langue.lexique"
        ]
      }
    ]
  },
  {
    "id": "chateau",
    "name": "Château des hypothèses",
    "module": "Grammaire : for et since, if, passif",
    "subject": "anglais",
    "classe": "3e",
    "description": "Depuis quand, et si…, et par qui : les phrases longues de 3e, la règle sous les yeux.",
    "block": "taille",
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
        "id": "passif",
        "title": "Passif",
        "description": "Is spoken, was built, will be shown : be + participe passé.",
        "programme": [
          "c4.en.langue.modaux-passif"
        ]
      }
    ]
  },
  {
    "id": "relais",
    "name": "Relais des voyageurs",
    "module": "Se présenter, compter, décrire",
    "subject": "lv2",
    "classe": "5e",
    "description": "Se présenter, compter, parler de sa famille et de son école : les premiers mots du voyage, dans ta deuxième langue.",
    "block": "dalle",
    "guardian": "la Diligence de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Lina"
    },
    "exercises": [
      {
        "id": "es-hola",
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
        "id": "es-numeros",
        "title": "Números",
        "description": "Les nombres entendus : sesenta ou setenta, doce ou dos ?",
        "programme": [
          "c4.es.ecouter.intervention-breve",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-familia",
        "title": "Familia y colegio",
        "description": "La famille, les consignes de la classe, un panneau ; tu ou tú ?",
        "programme": [
          "c4.es.lire.consignes-panneaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-el-la",
        "title": "El, la, los, las",
        "description": "L’article du nom, au singulier et au pluriel (el día).",
        "programme": [
          "c4.es.langue.groupe-nominal"
        ],
        "lv2": "es"
      },
      {
        "id": "de-hallo",
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
        "id": "de-zahlen",
        "title": "Zahlen",
        "description": "Les nombres entendus : -zehn ou -zig, 24 ou 42 ?",
        "programme": [
          "c4.de.ecouter.intervention-breve",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-familie",
        "title": "Familie und Schule",
        "description": "La famille, les consignes de la classe, un panneau ; schon ou schön ?",
        "programme": [
          "c4.de.lire.consignes-panneaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-der-die-das",
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
    "id": "jardin",
    "name": "Jardin des heures",
    "module": "La journée, l’heure, les repas",
    "subject": "lv2",
    "classe": "4e",
    "description": "Dire l’heure, raconter sa journée, lire un horaire ou un menu : une journée au jardin, dans ta deuxième langue.",
    "block": "osier",
    "guardian": "le Soleil de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Muscade"
    },
    "exercises": [
      {
        "id": "es-hora",
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
        "id": "es-mi-dia",
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
        "id": "es-horario",
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
        "id": "de-uhrzeit",
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
        "id": "de-mein-tag",
        "title": "Mein Tag",
        "description": "La journée : le verbe en deuxième place, puis la particule à la fin.",
        "programme": [
          "c4.de.langue.temps-verbaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-stundenplan",
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
        "id": "de-ich-kann",
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
    "id": "refuge",
    "name": "Refuge des carnets",
    "module": "Le voyage, le récit, relier ses idées",
    "subject": "lv2",
    "classe": "3e",
    "description": "Raconter un voyage au passé, lire les carnets des voyageurs, comparer, relier deux idées : dans ta deuxième langue.",
    "block": "bardeau",
    "guardian": "le Papillon de cuivre",
    "icon": "languages",
    "creature": {
      "name": "Timbre"
    },
    "exercises": [
      {
        "id": "es-viaje",
        "title": "¿Adónde fuiste?",
        "description": "Le voyage au passé : fui, visitó ; puis hier ou demain, ir a + infinitif.",
        "programme": [
          "c4.es.langue.temps-verbaux",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-relato",
        "title": "Historias de viaje",
        "description": "Une petite histoire de voyage, puis l’ordre de l’histoire : primero, luego, al final.",
        "programme": [
          "c4.es.lire.recit",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "es-paises",
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
        "id": "es-porque",
        "title": "Porque, cuando, pero",
        "description": "Relier deux idées, puis les faux amis.",
        "programme": [
          "c4.es.langue.phrase-complexe",
          "c4.es.langue.lexique"
        ],
        "lv2": "es"
      },
      {
        "id": "de-reise",
        "title": "Wohin bist du gefahren?",
        "description": "Le Perfekt avec haben, puis haben ou sein.",
        "programme": [
          "c4.de.langue.temps-verbaux",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-geschichte",
        "title": "Reisegeschichten",
        "description": "Une petite histoire de voyage, puis l’ordre de l’histoire : zuerst, dann, am Ende.",
        "programme": [
          "c4.de.lire.recit",
          "c4.de.langue.lexique"
        ],
        "lv2": "de"
      },
      {
        "id": "de-unterwegs",
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
        "id": "de-weil-dass",
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
