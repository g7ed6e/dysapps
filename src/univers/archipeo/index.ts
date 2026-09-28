// Les textes d'Archipéo (lot 6) : les Gardiens sont des sentinelles de pierre éteintes, que l'élève rallume par son
// savoir. « Rallumer » remplace « vaincre » ; chaque épreuve réussie nomme ce qui s'allume sur la sentinelle, chaque
// épreuve ratée commence par « Rien ne s'éteint. », et la réplique finale dit que la sentinelle « se rallume » (« brille
// à nouveau » est gardé pour le village et la baleine). Proposés par le consultant d'Archipéo, validés par le directeur
// artistique le 28 septembre 2026 ; lus seulement une fois l'univers ouvert (voir src/univers/index.ts).
import { BLOCLAND } from '../blocland';
import type { TextesUnivers } from '../types';

const s = (n: number) => (n > 1 ? 's' : '');

export const ARCHIPEO = {
  gardiens: {
    foret: {
      challenge: 'Le Grand Chêne craque : « Tu as bien écouté ma forêt. Ma couronne est éteinte. Montre-moi tout ce que tu sais faire. »',
      guardianSays: {
        hit: 'Une branche s’allume dans ma couronne. Tu as l’oreille fine.',
        miss: 'Rien ne s’éteint. Écoute bien le prochain mot, et continue.',
        beaten: 'Ma couronne se rallume. La forêt est à toi, et à Mousso.',
      },
    },
    mine: {
      challenge: 'Le Golem de roche gronde : « Ma pierre est froide. Mes lettres se ressemblent toutes. Toi, tu les reconnais ? Montre-le. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume jusqu’à ma gemme. Tu regardes bien.',
        miss: 'Rien ne s’éteint. Regarde bien la lettre, et reprends.',
        beaten: 'Ma gemme se rallume. La mine est à toi, et à Tunel.',
      },
    },
    carriere: {
      challenge: 'La Dune vivante murmure : « Mes couches de pierre sont éteintes. Écris chaque mot juste, et elles s’allumeront une à une. »',
      guardianSays: {
        hit: 'Une couche de pierre s’allume. Ce mot était bien écrit.',
        miss: 'Rien ne s’éteint. Essaie au prochain mot.',
        beaten: 'Mes couches de pierre se rallument. La carrière est à toi, et à Rouxel.',
      },
    },
    ferme: {
      challenge: 'Le Taureau de terre souffle : « Ici, tout doit s’accorder. Mon collier est éteint. À toi de jouer. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon collier. C’était bien accordé.',
        miss: 'Rien ne s’éteint. Le prochain enclos t’attend.',
        beaten: 'Mon collier se rallume. Tout s’accorde. La ferme est à toi, et à Bloquette.',
      },
    },
    tour: {
      challenge: 'La Chouette de verre murmure : « Mon vitrail est éteint. Lis-moi, à ton rythme. Le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Un morceau de mon vitrail s’allume. Tu lis bien.',
        miss: 'Rien ne s’éteint. Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Mon vitrail se rallume. La tour et son phare sont à toi, et à Grimoire.',
      },
    },
    plaine: {
      challenge: 'Le Hanneton de bronze bourdonne : « Tu as compté toute ma plaine. Mes ailes de bronze sont éteintes. Montre-moi ce que tu sais calculer. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume entre mes ailes. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les points, compte par cinq, et recommence.',
        beaten: 'Mes ailes se rallument. La plaine est à toi, et à Coco.',
      },
    },
    riviere: {
      challenge: 'Le Brochet d’argent murmure dans sa fontaine : « Tu as partagé toute ma rivière. Montre-moi comment tu lis les parts. »',
      guardianSays: {
        hit: 'Une part de mon flanc s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les parts, compte celles qui sont coloriées, et reprends.',
        beaten: 'Mon flanc se rallume. La rivière est à toi, et à Nénu.',
      },
    },
    volcan: {
      challenge: 'Le Dragon de cendre gronde : « Tu as gravi tout mon volcan. Ma braise est éteinte. Montre-moi comment tu lis la virgule. »',
      guardianSays: {
        hit: 'Une braise s’allume sur mon ventre. C’est exact.',
        miss: 'Rien ne s’éteint. Repère la virgule, puis lis les rangs un par un. Reprends.',
        beaten: 'Mon ventre de braise se rallume. Le volcan est à toi, et à Lavi.',
      },
    },
    glacier: {
      challenge: 'Le Mammouth de givre barrit : « Tu as traversé toute ma banquise. Mes veines de givre sont éteintes. Montre-moi comment tu comptes sous zéro. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mon givre. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Mes veines de givre se rallument. Le glacier est à toi, et à Frimas.',
      },
    },
    marche: {
      challenge: 'Le Colporteur lève sa lanterne éteinte : « Tu as fait le tour de mes étals. Montre-moi comment tu fais les comptes. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lanterne. Tu sais compter tes sous.',
        miss: 'Rien ne s’éteint. Passe par la valeur d’un seul, et reprends.',
        beaten: 'Ma lanterne se rallume. Le marché est à toi, et à Bazar.',
      },
    },
    carrefour: {
      challenge: 'Le Sphinx des routes parle : « Tu as lu tous mes panneaux. Montre-moi que tu choisis le bon chemin. »',
      guardianSays: {
        hit: 'Une bande de ma coiffe s’allume. Tu connais le chemin des mots.',
        miss: 'Rien ne s’éteint. Relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les routes sont à toi, et à Sema.',
      },
    },
    marais: {
      challenge: 'L’Hydre des marais parle de ses trois voix : « Tu as traversé mes trois eaux. Montre-moi que tu connais le passé, le futur et le doute. »',
      guardianSays: {
        hit: 'Une écaille de mes cous s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Mes trois cous se rallument. Le marais est à toi, et à Kroa.',
      },
    },
    forge: {
      challenge: 'Le Titan d’acier parle d’une voix de métal : « Tu as chauffé toute ma forge. Mon cœur de forge est froid. Montre-moi la puissance de tes calculs. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume vers mon cœur. C’est juste.',
        miss: 'Rien ne s’éteint. Relis la règle, compte les zéros, et reprends.',
        beaten: 'Mon cœur de forge se rallume. La forge est à toi, et à Braise.',
      },
    },
    atelier: {
      challenge: 'Le Golem des équations se met en équilibre : « Tu as tracé tous mes plans. Montre-moi que tu sais trouver l’inconnue. »',
      guardianSays: {
        hit: 'Un plateau de ma balance s’allume. Les deux côtés sont égaux.',
        miss: 'Rien ne s’éteint. Fais la même chose des deux côtés, et reprends.',
        beaten: 'Ma balance se rallume. L’atelier est à toi, et à Ixe.',
      },
    },
    falaise: {
      challenge: 'Le Bélier de granit parle depuis sa corniche : « Tu as gravi toute ma paroi. Montre-moi que tes accords sont solides. »',
      guardianSays: {
        hit: 'Une spirale de mes cornes s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Mes cornes se rallument. La falaise est à toi, et à Cléa.',
      },
    },
    cabinet: {
      challenge: 'Le Hibou lexicographe tient son dictionnaire fermé : « Tu as ouvert tous mes tiroirs. Montre-moi que tu sais démonter les mots. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon livre. Tu as trouvé la racine.',
        miss: 'Rien ne s’éteint. Découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Mon livre se rallume. Le cabinet est à toi, et à Plume.',
      },
    },
    belvedere: {
      challenge: 'Le Sphinx de marbre parle : « Tu as mesuré tout mon belvédère. Montre-moi que tu trouves ce qui manque. »',
      guardianSays: {
        hit: 'Un angle droit s’allume sur ma coiffe. C’est juste.',
        miss: 'Rien ne s’éteint. Repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les longueurs sont à toi, et à Théo.',
      },
    },
    donnees: {
      challenge: 'Le Comptable des étoiles tient son grand livre ouvert : « Tu as relevé toutes mes séries. Montre-moi que tu sais les résumer. »',
      guardianSays: {
        hit: 'Une étoile gravée s’allume sur ma robe. C’est juste.',
        miss: 'Rien ne s’éteint. Range la série, compte les valeurs, et reprends.',
        beaten: 'Mes étoiles se rallument. L’observatoire des données est à toi, et à Stat.',
      },
    },
    phare: {
      challenge: 'Le Dragon de lumière parle du haut de sa colonne : « Tu as allumé tout mon phare. Mes ailes de verre sont éteintes. Montre-moi que tu suis chaque nombre jusqu’à son image. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mes ailes. Tu as trouvé l’image.',
        miss: 'Rien ne s’éteint. Remplace x par le nombre, calcule, et reprends.',
        beaten: 'Mes ailes de verre se rallument. Le phare est à toi, et à Fi.',
      },
    },
    textes: {
      challenge: 'Le Grand Lecteur tient son livre ouvert : « Tu as observé tous mes textes. Montre-moi que tu vois ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Une page de mon livre s’allume. Tu lis ce qui n’est pas écrit.',
        miss: 'Rien ne s’éteint. Relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Mes pages se rallument. L’observatoire des textes est à toi, et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    baie: {
      challenge: 'Le Lion de pierre parle depuis son quai : « Tu as écouté tous les mots de la baie. Montre-moi que tu les comprends. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume dans ma crinière. Tu as l’oreille anglaise.',
        miss: 'Rien ne s’éteint. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Ma crinière se rallume. La baie est à toi, et à Robin.',
      },
    },
    horloge: {
      challenge: 'Le Coucou de bronze parle du haut de son horloge : « Tu as remonté tous mes rouages. Montre-moi que tes verbes sont justes. »',
      guardianSays: {
        hit: 'Une heure s’allume sur mon cadran. Ton verbe est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, relis la règle, et reprends.',
        beaten: 'Mon cadran se rallume. Les verbes sont à toi, et à Tick.',
      },
    },
    comptoir: {
      challenge: 'La Reine du marché parle depuis son estrade : « Tu as fait toutes tes courses en anglais. Montre-moi que tu comprends tout ce qu’on te dit. »',
      guardianSays: {
        hit: 'Une pierre de ma couronne s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Ma couronne se rallume. Le Comptoir est à toi, et à Pudding.',
      },
    },
    manoir: {
      challenge: 'Le Spectre du manoir parle sous son voile : « Tu as fouillé toutes mes pièces. Montre-moi que tu sais dire maintenant, hier, et plus fort que moi. »',
      guardianSays: {
        hit: 'Ma lanterne s’allume un peu plus sous mon voile. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le mot du temps, comme now ou yesterday, relis la règle, et reprends.',
        beaten: 'Ma lanterne se rallume sous mon voile. Le manoir est à toi, et à Moustache.',
      },
    },
    theatre: {
      challenge: 'Le Masque parle depuis sa stèle : « Tu connais toutes mes répliques. Montre-moi que tu sais donner la bonne. »',
      guardianSays: {
        hit: 'Une lampe de ma rampe s’allume. C’est la bonne réplique.',
        miss: 'Rien ne s’éteint. Réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Ma rampe se rallume. Le théâtre est à toi, et à Puck.',
      },
    },
    gare: {
      challenge: 'La Locomotive de fer attend sur son rail : « Tu as pris tous mes trains. Montre-moi que tu sais où tu vas. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lampe. Tu es sur les bons rails.',
        miss: 'Rien ne s’éteint. Cherche le petit mot, comme will, can ou already, relis la règle, et reprends.',
        beaten: 'Ma lampe se rallume. Les voies sont à toi, et à Vapeur.',
      },
    },
    studio: {
      challenge: 'La Grande Antenne grésille : « Tu as capté toutes mes ondes. Montre-moi que tu comprends chaque message. »',
      guardianSays: {
        hit: 'Mon voyant s’allume un peu plus. Message bien reçu.',
        miss: 'Rien ne s’éteint. Relis le texte, cherche l’indice, et reprends.',
        beaten: 'Mon voyant se rallume. Le studio est à toi, et à Écho.',
      },
    },
    chateau: {
      challenge: 'Le Dragon gallois parle depuis son bouclier : « Tu as franchi tous mes remparts. Montre-moi que tu maîtrises les phrases les plus longues. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon bouclier. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le petit mot, comme for, since, if ou by, relis la règle, et reprends.',
        beaten: 'Mon bouclier se rallume. Le château est à toi, et à Knight.',
      },
    },
  },
  especes: {
    foret: 'golem de mousse',
    mine: 'taupe',
    carriere: 'renard',
    ferme: 'brebis',
    tour: 'tortue copiste',
    plaine: 'coccinelle à dix points',
    riviere: 'grenouille des nénuphars',
    volcan: 'salamandre de lave',
    glacier: 'pingouin comptable',
    marche: 'raton laveur marchand',
    carrefour: 'caméléon des panneaux',
    marais: 'triton des roseaux',
    forge: 'golem forgeron',
    atelier: 'automate dessinateur',
    falaise: 'chèvre des cimes',
    cabinet: 'pie collectionneuse',
    belvedere: 'héron géomètre',
    donnees: 'chouette astronome',
    phare: 'lampe de phare vivante',
    textes: 'luciole lectrice',
    baie: 'rouge-gorge des quais',
    horloge: 'hérisson horloger',
    comptoir: 'bouledogue marchand',
    manoir: 'chat du manoir',
    theatre: 'lutin souffleur',
    gare: 'blaireau chef de gare',
    studio: 'chauve-souris animatrice radio',
    chateau: 'petit chevalier',
  },
  libelles: {
    dejaFait: 'Déjà rallumé. Tu veux rejouer ?',
    etoiles: 'Gardien rallumé',
    etoilesSur3: (etoiles) => `Gardien rallumé : ${etoiles} étoile${s(etoiles)} sur 3`,
    resistance: (reste, total) => `Encore ${reste} épreuve${s(reste)} sur ${total} pour le rallumer`,
    dejaFaitArene: (gardien) => `${gardien} brille déjà. Tu peux rejouer son défi quand tu veux.`,
    encoreAFaire: (n) => `encore ${n} Gardien${s(n)} à rallumer`,
    navireAttend: (n) => `Le Bloc-Navire a tous ses blocs ! Il attend encore ${n} Gardien${s(n)} rallumé${s(n)}.`,
    navireGardiens: (faits, total, archipel, piece) =>
      faits >= total ? `Gardiens : c’est fait ! ${faits} sur ${total}, ${piece} est là.` : `Gardiens : encore ${total - faits} à rallumer dans les ${archipel} pour ${piece}.`,
    faitsSur: (n, total) => `${n} Gardien${s(n)} rallumé${s(n)} sur ${total}`,
    progres: (n, total) => `${n} / ${total} Gardiens rallumés`,
  },
  baleine: {
    ...BLOCLAND.baleine,
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} brillent à nouveau. J’ai vu leur lumière depuis le large.`,
  },
} satisfies TextesUnivers;
