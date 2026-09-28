// Les textes de Blocland : ceux d'avant le lot 6, déplacés sans un mot changé (Blocland garde « vaincre », le Gardien
// vaincu et sa statue). Leur invariance est vérifiée par src/univers/univers.test.ts.
import type { TextesUnivers } from '../types';

const s = (n: number) => (n > 1 ? 's' : '');

export const BLOCLAND = {
  gardiens: {
    foret: {
      challenge: 'Le Grand Chêne craque : « Tu as bien écouté ma forêt. Montre-moi tout ce que tu sais faire. »',
      guardianSays: {
        hit: 'Mes branches tremblent. Tu as l’oreille fine.',
        miss: 'Ce n’est rien : même le vent se trompe de feuille. Continue.',
        beaten: 'Je m’incline, bâtisseur. La forêt est à toi… et à Mousso.',
      },
    },
    mine: {
      challenge: 'Le Golem de roche gronde : « Mes lettres se ressemblent toutes. Toi, tu les reconnais ? Prouve-le. »',
      guardianSays: {
        hit: 'Une fissure ! Tes yeux ne se trompent pas.',
        miss: 'Ma roche est dure, mais tu peux la reprendre. Regarde bien.',
        beaten: 'Je m’écroule… en pierres pour ton village. Bien joué.',
      },
    },
    carriere: {
      challenge: 'La Dune vivante siffle : « Chaque mot bien écrit me fait reculer. Écris juste, et je te laisserai passer. »',
      guardianSays: {
        hit: 'Je recule d’un pas. Ce mot était bien écrit.',
        miss: 'Le sable bouge, moi aussi. Réessaie au prochain mot.',
        beaten: 'Je me couche sur la plage. Le chemin est libre, bâtisseur.',
      },
    },
    ferme: {
      challenge: 'Le Taureau de terre frappe le sol : « Ici, tout s’accorde ou tout s’écroule. À toi de jouer. »',
      guardianSays: {
        hit: 'Meuh ! Mes sabots glissent. C’était bien accordé.',
        miss: 'Tout le monde trébuche parfois. Le prochain enclos est à toi.',
        beaten: 'Je m’assieds dans l’herbe. Tout s’accorde, tu as gagné.',
      },
    },
    tour: {
      challenge: 'La Chouette de verre cligne des yeux : « Lis-moi, à ton rythme. Le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Hou… Tu lis mieux que je ne vois la nuit.',
        miss: 'Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Hou hou. Le phare est à toi. Je te confie la nuit.',
      },
    },
    plaine: {
      challenge: 'Le Hanneton de bronze bourdonne : « Tu as compté toute ma plaine. Montre-moi ce que tu sais calculer. »',
      guardianSays: {
        hit: 'Bzzz… Juste ! Mes ailes de bronze grincent.',
        miss: 'Ce n’est rien : regarde les points, compte par cinq, et recommence.',
        beaten: 'Bzzz. Tu calcules plus vite que mes ailes. La plaine est à toi… et à Coco.',
      },
    },
    riviere: {
      challenge: 'Le Brochet d’argent fend l’eau : « Tu as partagé toute ma rivière. Montre-moi comment tu lis les parts. »',
      guardianSays: {
        hit: 'Plouf ! Juste. Mes écailles frissonnent.',
        miss: 'Ce n’est rien : regarde les parts, compte celles qui sont coloriées, et reprends.',
        beaten: 'Glou. Tu partages mieux que la rivière elle-même. Elle est à toi… et à Nénu.',
      },
    },
    volcan: {
      challenge: 'Le Dragon de cendre gronde : « Tu as gravi tout mon volcan. Montre-moi comment tu lis la virgule. »',
      guardianSays: {
        hit: 'Grrr… Exact. Ma fumée se dissipe.',
        miss: 'Ce n’est rien : repère la virgule, puis lis les rangs un par un. Reprends.',
        beaten: 'Grrr. Tu lis les rangs mieux que mes flammes. Le volcan est à toi… et à Lavi.',
      },
    },
    glacier: {
      challenge: 'Le Mammouth de givre barrit : « Tu as traversé toute ma banquise. Montre-moi comment tu comptes sous zéro. »',
      guardianSays: {
        hit: 'Brrr… Juste. Mes défenses en tremblent.',
        miss: 'Ce n’est rien : regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Brrr. Tu comptes même sous zéro. Le glacier est à toi… et à Frimas.',
      },
    },
    marche: {
      challenge: 'Le Colporteur pose sa besace : « Tu as fait le tour de mes étals. Montre-moi comment tu fais les comptes. »',
      guardianSays: {
        hit: 'Hé hé… Juste ! Tu sais compter tes sous.',
        miss: 'Ce n’est rien : passe par la valeur d’un seul, et reprends.',
        beaten: 'Hé hé. Tu marchandes mieux que moi. Le marché est à toi… et à Bazar.',
      },
    },
    carrefour: {
      challenge: 'Le Sphinx des routes se dresse : « Tu as lu tous mes panneaux. Montre-moi que tu ne te trompes plus de chemin. »',
      guardianSays: {
        hit: 'Hmm… Juste. Tu connais le chemin des mots.',
        miss: 'Ce n’est rien : relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Je m’écarte. Toutes les routes sont à toi… et à Sema.',
      },
    },
    marais: {
      challenge: 'L’Hydre des marais sort de la vase : « Tu as traversé mes trois eaux. Montre-moi que tu connais le passé, le futur et le doute. »',
      guardianSays: {
        hit: 'Sss… Juste. Une de mes têtes s’incline.',
        miss: 'Ce n’est rien : cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Sss. Mes trois têtes se taisent. Le marais est à toi… et à Kroa.',
      },
    },
    forge: {
      challenge: 'Le Titan d’acier lève son marteau : « Tu as chauffé toute ma forge. Montre-moi la puissance de tes calculs. »',
      guardianSays: {
        hit: 'Clang ! Juste. Mon armure sonne creux.',
        miss: 'Ce n’est rien : relis la règle, compte les zéros, et reprends.',
        beaten: 'Clang. Tu frappes plus fort que mon marteau. La forge est à toi… et à Braise.',
      },
    },
    atelier: {
      challenge: 'Le Golem des équations se met en équilibre : « Tu as tracé tous mes plans. Montre-moi que tu sais trouver l’inconnue. »',
      guardianSays: {
        hit: 'Égal… Juste. Mes deux plateaux sont à niveau.',
        miss: 'Ce n’est rien : fais la même chose des deux côtés, et reprends.',
        beaten: 'Égal. Tu as trouvé tous mes x. L’atelier est à toi… et à Ixe.',
      },
    },
    falaise: {
      challenge: 'Le Bélier de granit frappe le rocher : « Tu as gravi toute ma paroi. Montre-moi que tes accords tiennent la corde. »',
      guardianSays: {
        hit: 'Boum… Juste. Mes cornes s’émoussent.',
        miss: 'Ce n’est rien : cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Boum. Tu grimpes plus sûrement que moi. La falaise est à toi… et à Cléa.',
      },
    },
    cabinet: {
      challenge: 'Le Hibou lexicographe ferme son dictionnaire : « Tu as ouvert tous mes tiroirs. Montre-moi que tu sais démonter les mots. »',
      guardianSays: {
        hit: 'Hou… Juste. Tu as lu jusqu’à la racine.',
        miss: 'Ce n’est rien : découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Hou. Tu connais mes mots mieux que mon dictionnaire. Le cabinet est à toi… et à Plume.',
      },
    },
    belvedere: {
      challenge: 'Le Sphinx de marbre se redresse : « Tu as mesuré tout mon belvédère. Montre-moi que tu trouves ce qui manque. »',
      guardianSays: {
        hit: 'Hmm… Juste. L’angle droit te salue.',
        miss: 'Ce n’est rien : repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Je m’incline. Toutes les longueurs sont à toi… et à Théo.',
      },
    },
    donnees: {
      challenge: 'Le Comptable des étoiles ouvre son grand livre : « Tu as relevé toutes mes séries. Montre-moi que tu sais les résumer. »',
      guardianSays: {
        hit: 'Tic… Juste. Une étoile de plus dans ma colonne.',
        miss: 'Ce n’est rien : range la série, compte les valeurs, et reprends.',
        beaten: 'Tic. Tu comptes les étoiles mieux que moi. L’observatoire est à toi… et à Stat.',
      },
    },
    phare: {
      challenge: 'Le Dragon de lumière déploie ses ailes : « Tu as allumé tout mon phare. Montre-moi que tu suis la lumière de x jusqu’à f(x). »',
      guardianSays: {
        hit: 'Flash… Juste. Ma lumière trouve son image.',
        miss: 'Ce n’est rien : remplace x par le nombre, calcule, et reprends.',
        beaten: 'Flash. Tu éclaires plus loin que moi. Le phare est à toi… et à Fi.',
      },
    },
    textes: {
      challenge: 'Le Grand Lecteur lève les yeux de son livre : « Tu as observé tous mes textes. Montre-moi que tu vois ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Mmh… Juste. Tu lis ce qui n’est pas écrit.',
        miss: 'Ce n’est rien : relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Je ferme mon livre. L’observatoire est à toi… et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    baie: {
      challenge: 'Le Lion de pierre se dresse sur son socle : « Tu as écouté tous les mots de la baie. Montre-moi que tu les comprends. »',
      guardianSays: {
        hit: 'Rrr… Juste. Tu as l’oreille anglaise.',
        miss: 'Ce n’est rien : réécoute le mot, relis la règle, et reprends.',
        beaten: 'Je me recouche sur mon socle. La baie est à toi… et à Robin. Well done!',
      },
    },
    horloge: {
      challenge: 'Le Coucou de bronze jaillit de son horloge : « Tu as remonté tous mes rouages. Montre-moi que tes verbes sonnent juste. »',
      guardianSays: {
        hit: 'Coucou ! Juste. Ton verbe est à l’heure.',
        miss: 'Ce n’est rien : cherche le sujet, relis la règle, et reprends.',
        beaten: 'Coucou… Je rentre dans mon horloge. Les verbes sont à toi… et à Tick.',
      },
    },
    comptoir: {
      challenge: 'La Reine du marché descend de son estrade : « Tu as fait toutes tes courses en anglais. Montre-moi que tu comprends tout ce qu’on te dit. »',
      guardianSays: {
        hit: 'Splendid! Juste. Tu parles comme au marché de Londres.',
        miss: 'Ce n’est rien : réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Je range ma couronne. Le Comptoir est à toi… et à Pudding.',
      },
    },
    relais: {
      challenge: 'La Diligence de cuivre s’arrête devant l’auberge : « Tu as accueilli tous mes voyageurs. Montre-moi que tu comprends ce qu’ils te disent. »',
      guardianSays: {
        hit: 'Hue ! Juste. Mes roues tournent rond.',
        miss: 'Ce n’est rien : réécoute le mot, relis la règle, et reprends.',
        beaten: 'Je dételle mes chevaux. Le Relais est à toi… et à Lina.',
      },
    },
    manoir: {
      challenge: 'Le Spectre du manoir traverse le mur : « Tu as fouillé toutes mes pièces. Montre-moi que tu sais dire maintenant, hier, et plus fort que moi. »',
      guardianSays: {
        hit: 'Bouh… Juste. Tu ne crains pas le passé.',
        miss: 'Ce n’est rien : cherche le mot du temps (now, yesterday…), relis la règle, et reprends.',
        beaten: 'Je m’efface… Le manoir est à toi… et à Moustache.',
      },
    },
    theatre: {
      challenge: 'Le Masque descend des cintres : « Tu connais toutes mes répliques. Montre-moi que tu sais donner la bonne. »',
      guardianSays: {
        hit: 'Bravo! Juste. La salle applaudit.',
        miss: 'Ce n’est rien : réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Le rideau tombe. Le théâtre est à toi… et à Puck.',
      },
    },
    gare: {
      challenge: 'La Locomotive de fer entre en gare dans un nuage de vapeur : « Tu as pris tous mes trains. Montre-moi que tu sais où tu vas. »',
      guardianSays: {
        hit: 'Tchou ! Juste. Tu es sur les bons rails.',
        miss: 'Ce n’est rien : cherche le petit mot (will, can, already…), relis la règle, et reprends.',
        beaten: 'Je m’arrête en gare. Les voies sont à toi… et à Vapeur.',
      },
    },
    studio: {
      challenge: 'La Grande Antenne grésille et s’allume : « Tu as capté toutes mes ondes. Montre-moi que tu comprends chaque message. »',
      guardianSays: {
        hit: 'Bip… Juste. Message bien reçu.',
        miss: 'Ce n’est rien : relis le texte, cherche l’indice, et reprends.',
        beaten: 'Fin de l’émission. Le studio est à toi… et à Écho.',
      },
    },
    chateau: {
      challenge: 'Le Dragon gallois se pose sur le donjon : « Tu as franchi tous mes remparts. Montre-moi que tu maîtrises les phrases les plus longues. »',
      guardianSays: {
        hit: 'Grrr… Juste. Ma flamme vacille.',
        miss: 'Ce n’est rien : cherche le petit mot (for, since, if, by…), relis la règle, et reprends.',
        beaten: 'Je replie mes ailes rouges. Le château est à toi… et à Knight.',
      },
    },
  },
  especes: {
    foret: 'golem de mousse',
    mine: 'taupe cubique',
    carriere: 'renard cubique',
    ferme: 'vache carrée',
    tour: 'hibou de pierre',
    plaine: 'coccinelle à dix points',
    riviere: 'grenouille des nénuphars',
    volcan: 'salamandre de lave',
    glacier: 'pingouin comptable',
    marche: 'raton laveur marchand',
    carrefour: 'caméléon des panneaux',
    marais: 'triton des roseaux',
    forge: 'golem forgeron',
    atelier: 'robot dessinateur',
    falaise: 'chèvre des cimes',
    cabinet: 'pie collectionneuse',
    belvedere: 'héron géomètre',
    donnees: 'chouette astronome',
    phare: 'lampe de phare vivante',
    textes: 'luciole lectrice',
    baie: 'rouge-gorge des quais',
    horloge: 'hérisson horloger',
    comptoir: 'bouledogue marchand',
    relais: 'cigogne voyageuse',
    manoir: 'chat du manoir',
    theatre: 'lutin souffleur',
    gare: 'blaireau chef de gare',
    studio: 'chauve-souris animatrice radio',
    chateau: 'petit chevalier',
  },
  libelles: {
    dejaFait: 'Déjà vaincu. Une revanche ?',
    etoiles: 'Gardien vaincu',
    etoilesSur3: (etoiles) => `Gardien vaincu : ${etoiles} étoiles sur 3`,
    resistance: (reste, total) => `${reste} épreuves sur ${total} avant de le vaincre`,
    dejaFaitArene: (gardien) => `${gardien} est déjà vaincu, mais il aime les revanches.`,
    encoreAFaire: (n) => `encore ${n} Gardien${s(n)} à vaincre`,
    navireAttend: (n) => `Le Bloc-Navire a tous ses blocs ! Il attend encore ${n} Gardien${s(n)} vaincu${s(n)}.`,
    navireGardiens: (faits, total, archipel, piece) =>
      faits >= total ? `Gardiens : c’est fait ! ${faits} sur ${total}, ${piece} est là.` : `Gardiens : encore ${total - faits} à vaincre dans les ${archipel} pour ${piece}.`,
    faitsSur: (n, total) => `${n} Gardien${s(n)} vaincu${s(n)} sur ${total}`,
    progres: (n, total) => `${n} / ${total} Gardiens vaincus`,
    defiPret: 'Le Gardien accepte ton défi !',
    defiPretCourt: 'Prêt à t’affronter',
    defiFerme: (gardien, etoiles) => `${gardien} n’accepte que les bâtisseurs entraînés. Obtiens ${etoiles} étoiles dans chaque mission, puis reviens.`,
    arene: () => 'L’arène du Gardien',
  },
  sentinelles: null,
  monuments: {},
  baleine: {
    arrivee: {
      '6e': 'Je suis la baleine. Je passe au large quand tu fais quelque chose de grand.',
      '5e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles Brumeuses : six îles, et les mêmes règles.',
      '4e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Anciens Ateliers : les vieux ateliers attendent qu’on les remette en marche.',
      '3e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles du Ciel : ici, les îles flottent dans les nuages.',
    },
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} ont reconnu ton savoir. Je l’ai vu depuis le large.`,
    port: (ile) => `${ile} est restaurée. Tu avances bien : chaque île restaurée rend l’archipel plus beau.`,
    ouvrage: (ile) => `Un chemin s’ouvre vers ${ile}. L’archipel s’agrandit.`,
  },
} satisfies TextesUnivers;
