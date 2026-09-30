// Les textes d'Archipéo (lot 6) : les Gardiens sont des sentinelles de pierre éteintes, que l'élève rallume par son
// savoir. « Rallumer » remplace « vaincre » ; chaque épreuve réussie nomme ce qui s'allume sur la sentinelle, chaque
// épreuve ratée commence par « Rien ne s'éteint. », et la réplique finale dit que la sentinelle « se rallume » (« brille
// à nouveau » est gardé pour le village et la baleine). Proposés par le consultant d'Archipéo, validés par le directeur
// artistique le 28 septembre 2026 ; lus seulement une fois l'univers ouvert (voir src/univers/index.ts).
import { BLOCLAND } from '../blocland';
import { ETATS_D_ILE, REPLIQUES } from '../communs';
import type { TextesUnivers } from '../types';

const s = (n: number) => (n > 1 ? 's' : '');
/** « de » devant un nom avec son article : « du Grand Chêne », « de la Dune vivante », « de l’Hydre des marais ». */
const du = (nom: string) => nom.replace(/^le /, 'du ').replace(/^(la |l’)/, 'de $1');

export const ARCHIPEO = {
  gardiens: {
    foret: {
      challenge: 'Le Grand Chêne murmure : « Ma couronne est éteinte. Tu as bien écouté ma forêt, je t’écoute à mon tour. »',
      guardianSays: {
        hit: 'Une branche s’allume dans ma couronne. Tu as l’oreille fine.',
        miss: 'Rien ne s’éteint. Écoute bien le prochain mot, et continue.',
        beaten: 'Ma couronne se rallume. La forêt est à toi, et à Mousso.',
      },
    },
    mine: {
      challenge: 'Le Golem de roche dit doucement : « Ma gemme est éteinte, et mes lettres se ressemblent. Regarde-les bien, prends ton temps. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume jusqu’à ma gemme. Tu regardes bien.',
        miss: 'Rien ne s’éteint. Regarde bien la lettre, et reprends.',
        beaten: 'Ma gemme se rallume. La mine est à toi, et à Tunel.',
      },
    },
    carriere: {
      challenge: 'La Dune vivante souffle : « Mes couches de pierre sont éteintes. Écris chaque mot juste, et elles s’allumeront une à une. »',
      guardianSays: {
        hit: 'Une couche de pierre s’allume. Ce mot était bien écrit.',
        miss: 'Rien ne s’éteint. Essaie au prochain mot.',
        beaten: 'Mes couches de pierre se rallument. La carrière est à toi, et à Rouxel.',
      },
    },
    ferme: {
      challenge: 'Le Taureau de terre parle doucement : « Mon collier est éteint. Ici, tout doit s’accorder, cherche à ton rythme. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon collier. C’était bien accordé.',
        miss: 'Rien ne s’éteint. Le prochain enclos t’attend.',
        beaten: 'Mon collier se rallume. Tout s’accorde. La ferme est à toi, et à Bloquette.',
      },
    },
    tour: {
      challenge: 'La Chouette de verre chuchote : « Mon vitrail est éteint. Lis-moi sans te presser, le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Un morceau de mon vitrail s’allume. Tu lis bien.',
        miss: 'Rien ne s’éteint. Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Mon vitrail se rallume. La tour et son phare sont à toi, et à Grimoire.',
      },
    },
    plaine: {
      challenge: 'Le Hanneton de bronze bourdonne doucement : « Mes ailes de bronze sont éteintes. Tu as compté toute ma plaine, calcule avec moi. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume entre mes ailes. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les points, compte par cinq, et recommence.',
        beaten: 'Mes ailes se rallument. La plaine est à toi, et à Coco.',
      },
    },
    riviere: {
      challenge: 'Le Brochet d’argent murmure dans sa fontaine : « Mon flanc est éteint. Tu as partagé toute ma rivière, lis maintenant mes parts. »',
      guardianSays: {
        hit: 'Une part de mon flanc s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les parts, compte celles qui sont coloriées, et reprends.',
        beaten: 'Mon flanc se rallume. La rivière est à toi, et à Nénu.',
      },
    },
    volcan: {
      challenge: 'Le Dragon de cendre souffle une fumée tiède : « Ma braise est éteinte. Tu as gravi tout mon volcan, regarde bien où se place la virgule. »',
      guardianSays: {
        hit: 'Une braise s’allume sur mon ventre. C’est exact.',
        miss: 'Rien ne s’éteint. Repère la virgule, puis lis les rangs un par un. Reprends.',
        beaten: 'Mon ventre de braise se rallume. Le volcan est à toi, et à Lavi.',
      },
    },
    glacier: {
      challenge: 'Le Mammouth de givre dit à voix basse : « Mes veines de givre sont éteintes. Tu as traversé toute ma banquise, compte avec moi sous zéro. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mon givre. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Mes veines de givre se rallument. Le glacier est à toi, et à Frimas.',
      },
    },
    marche: {
      challenge: 'Le Colporteur chuchote derrière son étal : « Ma lanterne est éteinte. Tu as fait le tour de mes étals, faisons les comptes ensemble. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lanterne. Tu sais compter tes sous.',
        miss: 'Rien ne s’éteint. Passe par la valeur d’un seul, et reprends.',
        beaten: 'Ma lanterne se rallume. Le marché est à toi, et à Bazar.',
      },
    },
    carrefour: {
      challenge: 'Le Sphinx des routes dit doucement : « Ma coiffe est éteinte. Tu as lu tous mes panneaux, choisis le bon chemin. »',
      guardianSays: {
        hit: 'Une bande de ma coiffe s’allume. Tu connais le chemin des mots.',
        miss: 'Rien ne s’éteint. Relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les routes sont à toi, et à Sema.',
      },
    },
    marais: {
      challenge: 'L’Hydre des marais murmure de ses trois voix : « Mes trois cous sont éteints. Parle-moi du présent, du passé, du futur et du doute. »',
      guardianSays: {
        hit: 'Une écaille de mes cous s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Mes trois cous se rallument. Le marais est à toi, et à Kroa.',
      },
    },
    forge: {
      challenge: 'Le Titan d’acier parle d’une voix lente : « Mon cœur de forge est éteint. Tu as chauffé toute ma forge, prends le temps de tes calculs. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume vers mon cœur. C’est juste.',
        miss: 'Rien ne s’éteint. Relis la règle, compte les zéros, et reprends.',
        beaten: 'Mon cœur de forge se rallume. La forge est à toi, et à Braise.',
      },
    },
    atelier: {
      challenge: 'Le Golem des équations dit posément : « Ma balance est éteinte. Tu as tracé tous mes plans, cherche l’inconnue avec moi. »',
      guardianSays: {
        hit: 'Un plateau de ma balance s’allume. Les deux côtés sont égaux.',
        miss: 'Rien ne s’éteint. Fais la même chose des deux côtés, et reprends.',
        beaten: 'Ma balance se rallume. L’atelier est à toi, et à Ixe.',
      },
    },
    falaise: {
      challenge: 'Le Bélier de granit souffle depuis sa corniche : « Mes cornes sont éteintes. Tu as gravi toute ma paroi, accorde chaque mot avec soin. »',
      guardianSays: {
        hit: 'Une spirale de mes cornes s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Mes cornes se rallument. La falaise est à toi, et à Cléa.',
      },
    },
    cabinet: {
      challenge: 'Le Hibou lexicographe chuchote entre ses tiroirs : « Mon livre est éteint. Tu as ouvert tous mes tiroirs, démontons les mots ensemble. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon livre. Tu as trouvé la racine.',
        miss: 'Rien ne s’éteint. Découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Mon livre se rallume. Le cabinet est à toi, et à Plume.',
      },
    },
    belvedere: {
      challenge: 'Le Sphinx de marbre dit à voix basse : « Ma coiffe est éteinte. Tu as mesuré tout mon belvédère, cherche ce qui manque. »',
      guardianSays: {
        hit: 'Un angle droit s’allume sur ma coiffe. C’est juste.',
        miss: 'Rien ne s’éteint. Repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les longueurs sont à toi, et à Théo.',
      },
    },
    donnees: {
      challenge: 'Le Comptable des étoiles dit doucement, son grand livre ouvert : « Mes étoiles gravées sont éteintes. Tu as relevé toutes mes séries, résumons-les ensemble. »',
      guardianSays: {
        hit: 'Une étoile gravée s’allume sur ma robe. C’est juste.',
        miss: 'Rien ne s’éteint. Range la série, compte les valeurs, et reprends.',
        beaten: 'Mes étoiles se rallument. L’observatoire des données est à toi, et à Stat.',
      },
    },
    phare: {
      challenge: 'Le Dragon de lumière souffle du haut de sa colonne : « Mes ailes de verre sont éteintes. Suis chaque nombre jusqu’à son image, à ton rythme. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mes ailes. C’est juste.',
        miss: 'Rien ne s’éteint. Relis la formule ou le graphique, et reprends.',
        beaten: 'Mes ailes de verre se rallument. Le phare est à toi, et à Fi.',
      },
    },
    textes: {
      challenge: 'Le Grand Lecteur murmure, son livre ouvert : « Mes pages sont éteintes. Tu as observé tous mes textes, cherche ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Une page de mon livre s’allume. Tu lis ce qui n’est pas écrit.',
        miss: 'Rien ne s’éteint. Relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Mes pages se rallument. L’observatoire des textes est à toi, et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    baie: {
      challenge: 'Le Lion de pierre parle doucement depuis son quai : « Ma crinière est éteinte. Tu as écouté tous les mots de la baie, écoute-les encore. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume dans ma crinière. Tu as l’oreille anglaise.',
        miss: 'Rien ne s’éteint. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Ma crinière se rallume. La baie est à toi, et à Robin.',
      },
    },
    horloge: {
      challenge: 'Le Coucou de bronze chuchote du haut de son horloge : « Mon cadran est éteint. Tu as remonté tous mes rouages, vérifie chaque verbe avec moi. »',
      guardianSays: {
        hit: 'Une heure s’allume sur mon cadran. Ton verbe est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, relis la règle, et reprends.',
        beaten: 'Mon cadran se rallume. Les verbes sont à toi, et à Tick.',
      },
    },
    comptoir: {
      challenge: 'La Reine du marché dit doucement depuis son estrade : « Ma couronne est éteinte. Tu as fait tes courses en anglais, écoute bien ce qu’on te dit. »',
      guardianSays: {
        hit: 'Une pierre de ma couronne s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Ma couronne se rallume. Le Comptoir est à toi, et à Pudding.',
      },
    },
    relais: {
      challenge: 'La Diligence de cuivre dit doucement depuis le ponton : « La boussole de mon siège est éteinte. Tu as fait escale chez mes voyageurs : écoute bien ce qu’ils te disent. »',
      guardianSays: {
        hit: 'Une pointe de ma rose des vents s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Ma boussole se rallume. Le Relais est à toi, et à Lina.',
      },
    },
    jardin: {
      challenge: 'Le Soleil de cuivre dit doucement depuis son socle : « Mes rayons sont éteints. Tu as suivi toutes les heures du jardin : écoute bien, et raconte-moi ta journée. »',
      guardianSays: {
        hit: 'Mes rayons brillent un peu plus. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Mes rayons se rallument. Le jardin est à toi, et à Muscade.',
      },
    },
    manoir: {
      challenge: 'Le Spectre du manoir murmure sous son voile : « Ma lanterne est éteinte. Tu as fouillé toutes mes pièces, raconte-moi aujourd’hui, hier, et ce qui est plus grand. »',
      guardianSays: {
        hit: 'Ma lanterne s’allume un peu plus sous mon voile. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le mot du temps, comme now ou yesterday, relis la règle, et reprends.',
        beaten: 'Ma lanterne se rallume sous mon voile. Le manoir est à toi, et à Moustache.',
      },
    },
    theatre: {
      challenge: 'Le Masque souffle depuis sa stèle : « Ma rampe est éteinte. Tu connais toutes mes répliques, cherche la bonne. »',
      guardianSays: {
        hit: 'Une lampe de ma rampe s’allume. C’est la bonne réplique.',
        miss: 'Rien ne s’éteint. Réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Ma rampe se rallume. Le théâtre est à toi, et à Puck.',
      },
    },
    gare: {
      challenge: 'La Locomotive de fer attend sur son rail et dit doucement : « Ma lampe est éteinte. Tu as pris tous mes trains, dis-moi où tu vas. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lampe. Tu es sur les bons rails.',
        miss: 'Rien ne s’éteint. Cherche le petit mot, comme will, can ou already, relis la règle, et reprends.',
        beaten: 'Ma lampe se rallume. Les voies sont à toi, et à Vapeur.',
      },
    },
    studio: {
      challenge: 'La Grande Antenne grésille doucement : « Mon voyant est éteint. Tu as capté toutes mes ondes, écoute chaque message. »',
      guardianSays: {
        hit: 'Mon voyant s’allume un peu plus. Message bien reçu.',
        miss: 'Rien ne s’éteint. Relis le texte, cherche l’indice, et reprends.',
        beaten: 'Mon voyant se rallume. Le studio est à toi, et à Écho.',
      },
    },
    chateau: {
      challenge: 'Le Dragon gallois dit à voix basse : « Mon bouclier est éteint. Tu as franchi tous mes remparts, lis les phrases les plus longues à ton rythme. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon bouclier. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le petit mot, comme for, since, if ou by, relis la règle, et reprends.',
        beaten: 'Mon bouclier se rallume. Le château est à toi, et à Knight.',
      },
    },
  },
  creatures: REPLIQUES,
  etatsDIle: ETATS_D_ILE,
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
    relais: 'cigogne voyageuse',
    jardin: 'écureuil cuisinier',
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
    // Le défi se relève, il ne se livre pas : ni exclamation ni « bâtisseur », rien à accorder selon le Gardien.
    defiPret: 'Le défi du Gardien est prêt.',
    defiPretCourt: 'Défi prêt',
    defiFerme: (gardien, etoiles) => `${gardien} attend encore. Obtiens ${etoiles} étoiles dans chaque mission de l’île, puis reviens relever son défi.`,
    arene: (gardien) => `Le défi ${du(gardien)}`,
  },
  // La lumière ne dit que les réussites : « la rallumer » renvoie à « sa lumière », sans accord selon le Gardien.
  sentinelles: {
    consigne: 'Chaque épreuve réussie allume une partie de sa lumière, et une épreuve ratée n’éteint rien. Prends ton temps, personne ne compte les secondes.',
    regle: 'Une épreuve ratée n’éteint rien.',
    jauge: 'Épreuves réussies',
    compte: (reussies, total) => `${reussies} sur ${total}`,
    seuil: (n, assez) => (assez ? 'C’est assez pour rallumer sa lumière.' : `Il faut ${n} épreuves réussies pour rallumer sa lumière.`),
    jaugeLue: (reussies, total, n) => `${reussies} épreuve${s(reussies)} réussie${s(reussies)} sur ${total}, il en faut ${n}`,
    rallume: (gardien) => `${gardien} brille à nouveau.`,
  },
  baleine: {
    ...BLOCLAND.baleine,
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} brillent à nouveau. J’ai vu leur lumière depuis le large.`,
  },
  // Le phare du large est dessiné pour Archipéo (revue d'ensemble, DA-4) : une tour ronde de pierre à feu ouvert.
  monuments: {
    'monument-phare-large': {
      description: 'Une haute tour ronde de pierre grise. À son sommet, un feu brûle pour guider les navires dans la brume.',
      done: 'Le phare du large s’allume ! Plus aucun navire ne se perd dans la brume.',
    },
  },
} satisfies TextesUnivers;
