// Les textes d'Archipéo (lot 6) : les Gardiens sont des sentinelles de pierre éteintes, que l'élève rallume par son
// savoir. « Rallumer » remplace « vaincre » ; chaque épreuve réussie nomme ce qui s'allume sur la sentinelle, chaque
// épreuve ratée commence par « Rien ne s'éteint. », et la réplique finale dit que la sentinelle « se rallume » (« brille
// à nouveau » est gardé pour le village et la baleine). Proposés par le consultant d'Archipéo, validés par le directeur
// artistique le 28 septembre 2026 ; lus seulement une fois l'univers ouvert (voir src/universes/index.ts).
import { agreeWithPlace, thePlace } from '../../game/world/placeArticle';
import { BLOCLAND } from '../blocland';
import { ETATS_D_ILE, REPLIQUES } from '../common';
import type { TextesUnivers } from '../types';
import { lieuDAssemblage, nomsAssembles } from '../../game/world/assembly';

const s = (n: number) => (n > 1 ? 's' : '');
/** « de » devant un nom avec son article : « du Grand Chêne », « de la Dune vivante », « de l’Hydre des marais ». */
const du = (nom: string) => nom.replace(/^le /, 'du ').replace(/^(la |l’)/, 'de $1');

export const ARCHIPEO = {
  gardiens: {
    'french-6e-phonology': {
      challenge: 'Le Grand Chêne murmure : « Ma couronne est éteinte. Tu as bien écouté ma forêt, je t’écoute à mon tour. »',
      guardianSays: {
        hit: 'Une branche s’allume dans ma couronne. Tu as l’oreille fine.',
        miss: 'Rien ne s’éteint. Écoute bien le prochain mot, et continue.',
        beaten: 'Ma couronne se rallume. La forêt est à toi, et à Mousso.',
      },
    },
    'french-6e-letter-confusion': {
      challenge: 'Le Golem de roche dit doucement : « Ma gemme est éteinte, et mes lettres se ressemblent. Regarde-les bien, prends ton temps. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume jusqu’à ma gemme. Tu regardes bien.',
        miss: 'Rien ne s’éteint. Regarde bien la lettre, et reprends.',
        beaten: 'Ma gemme se rallume. La mine est à toi, et à Tunel.',
      },
    },
    'french-6e-word-spelling': {
      challenge: 'La Dune vivante souffle : « Mes couches de pierre sont éteintes. Écris chaque mot juste, et elles s’allumeront une à une. »',
      guardianSays: {
        hit: 'Une couche de pierre s’allume. Ce mot était bien écrit.',
        miss: 'Rien ne s’éteint. Essaie au prochain mot.',
        beaten: 'Mes couches de pierre se rallument. La carrière est à toi, et à Rouxel.',
      },
    },
    'french-6e-grammar-spelling': {
      challenge: 'Le Taureau de terre parle doucement : « Mon collier est éteint. Ici, tout doit s’accorder, cherche à ton rythme. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon collier. C’était bien accordé.',
        miss: 'Rien ne s’éteint. Le prochain enclos t’attend.',
        beaten: 'Mon collier se rallume. Tout s’accorde. La ferme est à toi, et à Bloquette.',
      },
    },
    'french-6e-reading': {
      challenge: 'La Chouette de verre chuchote : « Mon vitrail est éteint. Lis-moi sans te presser, le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Un morceau de mon vitrail s’allume. Tu lis bien.',
        miss: 'Rien ne s’éteint. Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Mon vitrail se rallume. La tour et son phare sont à toi, et à Grimoire.',
      },
    },
    'maths-6e-calculation': {
      challenge: 'Le Hanneton de bronze bourdonne doucement : « Mes ailes de bronze sont éteintes. Tu as compté toute ma plaine, calcule avec moi. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume entre mes ailes. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les points, compte par cinq, et recommence.',
        beaten: 'Mes ailes se rallument. La plaine est à toi, et à Coco.',
      },
    },
    'maths-6e-fractions': {
      challenge: 'Le Brochet d’argent murmure dans sa fontaine : « Mon flanc est éteint. Tu as partagé toute ma rivière, lis maintenant mes parts. »',
      guardianSays: {
        hit: 'Une part de mon flanc s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde les parts ou l’opération posée, et reprends.',
        beaten: 'Mon flanc se rallume. La rivière est à toi, et à Nénu.',
      },
    },
    'maths-6e-decimals': {
      challenge: 'Le Dragon de cendre souffle une fumée tiède : « Ma braise est éteinte. Tu as gravi tout mon volcan, lis chaque nombre rang par rang. »',
      guardianSays: {
        hit: 'Une braise s’allume sur mon ventre. C’est exact.',
        miss: 'Rien ne s’éteint. Regarde le tableau ou la droite, rang par rang, et reprends.',
        beaten: 'Mon ventre de braise se rallume. Le volcan est à toi, et à Lavi.',
      },
    },
    'maths-5e-signed-numbers': {
      challenge: 'Le Mammouth de givre dit à voix basse : « Mes veines de givre sont éteintes. Tu as traversé toute ma banquise, compte avec moi sous zéro. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mon givre. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Mes veines de givre se rallument. Le glacier est à toi, et à Frimas.',
      },
    },
    'maths-5e-proportionality': {
      challenge: 'Le Colporteur chuchote derrière son étal : « Ma lanterne est éteinte. Tu as fait le tour de mes étals, faisons les comptes ensemble. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lanterne. Tu sais compter tes sous.',
        miss: 'Rien ne s’éteint. Passe par la valeur d’un seul, et reprends.',
        beaten: 'Ma lanterne se rallume. Le marché est à toi, et à Bazar.',
      },
    },
    'french-5e-homophones': {
      challenge: 'Le Sphinx des routes dit doucement : « Ma coiffe est éteinte. Tu as lu tous mes panneaux, choisis le bon chemin. »',
      guardianSays: {
        hit: 'Une bande de ma coiffe s’allume. Tu connais le chemin des mots.',
        miss: 'Rien ne s’éteint. Relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les routes sont à toi, et à Sema.',
      },
    },
    'french-5e-conjugation': {
      challenge: 'L’Hydre des marais murmure de ses trois voix : « Mes trois cous sont éteints. Parle-moi du présent, du passé, du futur et du doute. »',
      guardianSays: {
        hit: 'Une écaille de mes cous s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Mes trois cous se rallument. Le marais est à toi, et à Kroa.',
      },
    },
    'maths-4e-powers': {
      challenge: 'Le Titan d’acier parle d’une voix lente : « Mon cœur de forge est éteint. Tu as chauffé toute ma forge, prends le temps de tes calculs. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume vers mon cœur. C’est juste.',
        miss: 'Rien ne s’éteint. Relis la règle, compte les zéros, et reprends.',
        beaten: 'Mon cœur de forge se rallume. La forge est à toi, et à Braise.',
      },
    },
    'maths-4e-algebra': {
      challenge: 'Le Golem des équations dit posément : « Ma balance est éteinte. Tu as tracé tous mes plans, cherche l’inconnue avec moi. »',
      guardianSays: {
        hit: 'Un plateau de ma balance s’allume. Les deux côtés sont égaux.',
        miss: 'Rien ne s’éteint. Fais la même chose des deux côtés, et reprends.',
        beaten: 'Ma balance se rallume. L’atelier est à toi, et à Ixe.',
      },
    },
    'french-4e-agreement': {
      challenge: 'Le Bélier de granit souffle depuis sa corniche : « Mes cornes sont éteintes. Tu as gravi toute ma paroi, accorde chaque mot avec soin. »',
      guardianSays: {
        hit: 'Une spirale de mes cornes s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Mes cornes se rallument. La falaise est à toi, et à Cléa.',
      },
    },
    'french-4e-vocabulary': {
      challenge: 'Le Hibou lexicographe chuchote entre ses tiroirs : « Mon livre est éteint. Tu as ouvert tous mes tiroirs, démontons les mots ensemble. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume sur mon livre. Tu as trouvé la racine.',
        miss: 'Rien ne s’éteint. Découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Mon livre se rallume. Le cabinet est à toi, et à Plume.',
      },
    },
    'maths-3e-geometry': {
      challenge: 'Le Sphinx de marbre dit à voix basse : « Ma coiffe est éteinte. Tu as mesuré tout mon belvédère, cherche ce qui manque. »',
      guardianSays: {
        hit: 'Un angle droit s’allume sur ma coiffe. C’est juste.',
        miss: 'Rien ne s’éteint. Repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Ma coiffe se rallume. Toutes les longueurs sont à toi, et à Théo.',
      },
    },
    'maths-3e-statistics': {
      challenge: 'Le Comptable des étoiles dit doucement, son grand livre ouvert : « Mes étoiles gravées sont éteintes. Tu as relevé toutes mes séries, résumons-les ensemble. »',
      guardianSays: {
        hit: 'Une étoile gravée s’allume sur ma robe. C’est juste.',
        miss: 'Rien ne s’éteint. Range la série, compte les valeurs, et reprends.',
        beaten: 'Mes étoiles se rallument. L’observatoire des données est à toi, et à Stat.',
      },
    },
    'maths-3e-functions': {
      challenge: 'Le Dragon de lumière souffle du haut de sa colonne : « Mes ailes de verre sont éteintes. Suis chaque nombre jusqu’à son image, à ton rythme. »',
      guardianSays: {
        hit: 'Une veine s’allume dans mes ailes. C’est juste.',
        miss: 'Rien ne s’éteint. Relis la formule ou le graphique, et reprends.',
        beaten: 'Mes ailes de verre se rallument. Le phare est à toi, et à Fi.',
      },
    },
    'french-3e-close-reading': {
      challenge: 'Le Grand Lecteur murmure, son livre ouvert : « Mes pages sont éteintes. Tu as observé tous mes textes, cherche ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Une page de mon livre s’allume. Tu lis ce qui n’est pas écrit.',
        miss: 'Rien ne s’éteint. Relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Mes pages se rallument. L’observatoire des textes est à toi, et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    'english-6e-vocabulary': {
      challenge: 'Le Lion de pierre parle doucement depuis son quai : « Ma crinière est éteinte. Tu as écouté tous les mots de la baie, écoute-les encore. »',
      guardianSays: {
        hit: 'Une veine d’or s’allume dans ma crinière. Tu as l’oreille anglaise.',
        miss: 'Rien ne s’éteint. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Ma crinière se rallume. La baie est à toi, et à Robin.',
      },
    },
    'english-6e-grammar': {
      challenge: 'Le Coucou de bronze chuchote du haut de son horloge : « Mon cadran est éteint. Tu as remonté tous mes rouages, vérifie chaque verbe avec moi. »',
      guardianSays: {
        hit: 'Une heure s’allume sur mon cadran. Ton verbe est juste.',
        miss: 'Rien ne s’éteint. Cherche le sujet, relis la règle, et reprends.',
        beaten: 'Mon cadran se rallume. Les verbes sont à toi, et à Tick.',
      },
    },
    'english-5e-vocabulary': {
      challenge: 'La Reine du marché dit doucement depuis son estrade : « Ma couronne est éteinte. Tu as fait tes courses en anglais, écoute bien ce qu’on te dit. »',
      guardianSays: {
        hit: 'Une pierre de ma couronne s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Ma couronne se rallume. Le Comptoir est à toi, et à Pudding.',
      },
    },
    'lv2-5e-introductions': {
      challenge: 'La Diligence de cuivre dit doucement depuis le ponton : « La boussole de mon siège est éteinte. Tu as fait escale chez mes voyageurs : écoute bien ce qu’ils te disent. »',
      guardianSays: {
        hit: 'Une pointe de ma rose des vents s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Ma boussole se rallume. Le Relais est à toi, et à Lina.',
      },
    },
    'lv2-4e-daily-life': {
      challenge: 'Le Soleil de cuivre dit doucement depuis son socle : « Mes rayons sont éteints. Tu as suivi toutes les heures du jardin : écoute bien, et raconte-moi ta journée. »',
      guardianSays: {
        hit: 'Mes rayons brillent un peu plus. C’est juste.',
        miss: 'Rien ne s’éteint. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Mes rayons se rallument. Le jardin est à toi, et à Muscade.',
      },
    },
    'history-6e-antiquity': {
      challenge: 'L’Amphore peinte dit doucement : « Mes bandes peintes sont éteintes. Tu as relevé toutes les trouvailles : remets chaque époque à sa place. »',
      guardianSays: {
        hit: 'Une bande de ma frise s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Regarde la frise, du plus ancien au plus récent, et reprends.',
        beaten: 'Ma frise se rallume. La fouille est à toi, et à Silex.',
      },
    },
    'geography-6e-living': {
      challenge: 'Le Castor de glaise dit doucement : « Les traits de mon pelage sont éteints. Tu as regardé tous les paysages de la Pointe : dis-moi où vivent les humains. »',
      guardianSays: {
        hit: 'Un trait de mon pelage s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Relis le document, cherche le mot du rappel, et reprends.',
        beaten: 'Mon pelage se rallume. La pointe est à toi, et à Boussole.',
      },
    },
    'life-earth-sciences-6e-living-world': {
      challenge: 'Le Cerf des sous-bois dit doucement : « Mon manteau de mousse est éteint. Tu as observé tout le vivant de la vallée : aide-moi à le classer. »',
      guardianSays: {
        hit: 'Une touffe de mon manteau s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Relis le document, regarde ce que l’être vivant possède, et reprends.',
        beaten: 'Mon manteau se rallume. La vallée est à toi, et à Fougère.',
      },
    },
    'physics-chemistry-6e-matter-energy': {
      challenge: 'L’Alambic de verre dit doucement : « Mon ballon de verre est éteint. Tu as fait toutes les expériences du laboratoire : aide-moi à les comprendre. »',
      guardianSays: {
        hit: 'Une bulle de mon ballon s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Relis le document, regarde l’instrument, et reprends.',
        beaten: 'Mon ballon se rallume. Le laboratoire est à toi, et à Bulle.',
      },
    },
    'technology-6e-objects': {
      challenge: 'L’Automate de laiton dit doucement : « Les boutons de ma poitrine sont éteints. Tu as essayé tous les objets du hangar : dis-moi à quoi ils servent. »',
      guardianSays: {
        hit: 'Un bouton de ma poitrine s’allume. C’est juste.',
        miss: 'Rien ne s’éteint. Relis le schéma, cherche à quoi sert l’objet, et reprends.',
        beaten: 'Mes boutons se rallument. Le hangar est à toi, et à Pince.',
      },
    },
    'lv2-3e-travel': {
      challenge: 'Le Papillon de cuivre dit doucement : « Le bord de mes ailes est éteint. Tu as rencontré tous les voyageurs du refuge : dis-moi ce qu’ils ont vécu. »',
      guardianSays: {
        hit: 'Le bord de mes ailes brille un peu plus. C’est juste.',
        miss: 'Rien ne s’éteint. Lis bien la question, relis la règle, et reprends.',
        beaten: 'Le bord de mes ailes se rallume. Le refuge est à toi, et à Timbre.',
      },
    },
    'english-5e-grammar': {
      challenge: 'Le Spectre du manoir murmure sous son voile : « Ma lanterne est éteinte. Tu as fouillé toutes mes pièces, raconte-moi aujourd’hui, hier, et ce qui est plus grand. »',
      guardianSays: {
        hit: 'Ma lanterne s’allume un peu plus sous mon voile. C’est juste.',
        miss: 'Rien ne s’éteint. Cherche le mot du temps, comme now ou yesterday, relis la règle, et reprends.',
        beaten: 'Ma lanterne se rallume sous mon voile. Le manoir est à toi, et à Moustache.',
      },
    },
    'english-4e-comprehension': {
      challenge: 'Le Masque souffle depuis sa stèle : « Ma rampe est éteinte. Tu connais toutes mes répliques, cherche la bonne. »',
      guardianSays: {
        hit: 'Une lampe de ma rampe s’allume. C’est la bonne réplique.',
        miss: 'Rien ne s’éteint. Réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Ma rampe se rallume. Le théâtre est à toi, et à Puck.',
      },
    },
    'english-4e-grammar': {
      challenge: 'La Locomotive de fer attend sur son rail et dit doucement : « Ma lampe est éteinte. Tu as pris tous mes trains, dis-moi où tu vas. »',
      guardianSays: {
        hit: 'Une lueur s’allume dans ma lampe. Tu es sur les bons rails.',
        miss: 'Rien ne s’éteint. Cherche le petit mot, comme will, can ou already, relis la règle, et reprends.',
        beaten: 'Ma lampe se rallume. Les voies sont à toi, et à Vapeur.',
      },
    },
    'english-3e-comprehension': {
      challenge: 'La Grande Antenne grésille doucement : « Mon voyant est éteint. Tu as capté toutes mes ondes, écoute chaque message. »',
      guardianSays: {
        hit: 'Mon voyant s’allume un peu plus. Message bien reçu.',
        miss: 'Rien ne s’éteint. Relis le texte, cherche l’indice, et reprends.',
        beaten: 'Mon voyant se rallume. Le studio est à toi, et à Écho.',
      },
    },
    'english-3e-grammar': {
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
    'french-6e-phonology': 'golem de mousse',
    'french-6e-letter-confusion': 'taupe',
    'french-6e-word-spelling': 'renard',
    'french-6e-grammar-spelling': 'brebis',
    'french-6e-reading': 'tortue copiste',
    'maths-6e-calculation': 'coccinelle à dix points',
    'maths-6e-fractions': 'grenouille des nénuphars',
    'maths-6e-decimals': 'salamandre de lave',
    'maths-5e-signed-numbers': 'pingouin comptable',
    'maths-5e-proportionality': 'raton laveur marchand',
    'french-5e-homophones': 'caméléon des panneaux',
    'french-5e-conjugation': 'triton des roseaux',
    'maths-4e-powers': 'golem forgeron',
    'maths-4e-algebra': 'automate dessinateur',
    'french-4e-agreement': 'chèvre des cimes',
    'french-4e-vocabulary': 'pie collectionneuse',
    'maths-3e-geometry': 'héron géomètre',
    'maths-3e-statistics': 'chouette astronome',
    'maths-3e-functions': 'lampe de phare vivante',
    'french-3e-close-reading': 'luciole lectrice',
    'english-6e-vocabulary': 'rouge-gorge des quais',
    'english-6e-grammar': 'hérisson horloger',
    'english-5e-vocabulary': 'bouledogue marchand',
    'lv2-5e-introductions': 'cigogne voyageuse',
    'lv2-4e-daily-life': 'écureuil cuisinier',
    'lv2-3e-travel': 'loutre factrice',
    'english-5e-grammar': 'chat du manoir',
    'english-4e-comprehension': 'lutin souffleur',
    'english-4e-grammar': 'blaireau chef de gare',
    'english-3e-comprehension': 'chauve-souris animatrice radio',
    'english-3e-grammar': 'petit chevalier',
    'history-6e-antiquity': 'ourson des fouilles',
    'geography-6e-living': 'pélican des ports',
    'life-earth-sciences-6e-living-world': 'escargot jardinier',
    'physics-chemistry-6e-matter-energy': 'poulpe chimiste',
    'technology-6e-objects': 'fourmi bricoleuse',
  },
  libelles: {
    dejaFait: 'Déjà rallumé. Tu veux rejouer ?',
    etoiles: 'Gardien rallumé',
    etoilesSur3: (etoiles) => `Gardien rallumé : ${etoiles} étoile${s(etoiles)} sur 3`,
    resistance: (reste, total) => `Encore ${reste} épreuve${s(reste)} sur ${total} pour le rallumer`,
    dejaFaitArene: (gardien) => `${gardien} brille déjà. Tu peux rejouer son défi quand tu veux.`,
    encoreAFaire: (n) => `encore ${n} Gardien${s(n)} à rallumer`,
    navireAttend: (n, piece) => `Le Bloc-Navire a tous ses blocs ! Il attend encore ${n} Gardien${s(n)} rallumé${s(n)}${piece ? ` pour ${piece}` : ''}.`,
    navireGardiens: (faits, total, archipel, piece) =>
      faits >= total ? `Gardiens : c’est fait ! ${faits} sur ${total}, ${piece} est là.` : `Gardiens : encore ${total - faits} à rallumer dans les ${archipel} pour ${piece}.`,
    faitsSur: (n, total) => `${n} Gardien${s(n)} rallumé${s(n)} sur ${total}`,
    progres: (n, total) => `${n} / ${total} Gardiens rallumés`,
    // Le défi se relève, il ne se livre pas : ni exclamation ni « bâtisseur », rien à accorder selon le Gardien.
    defiPret: 'Le défi du Gardien est prêt.',
    defiPretCourt: 'Défi prêt',
    arene: (gardien) => `Le défi ${du(gardien)}`,
    decouverteOuvrages:
      'Les îles pâles sont fermées. Pour y aller, pose un ouvrage. Il part de l’île de ton choix. Chaque ouvrage coûte le même nombre de blocs.',
    navireGardiensManquants: (n, archipel) => `rallume encore ${n} Gardien${s(n)} des ${archipel}`,
    decouverteNavire: BLOCLAND.libelles.decouverteNavire,
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
  // La baleine parle aux grandes étapes : ses textes sont ceux d'avant GD-1, gardés ici (Blocland a pris sa propre voix).
  baleine: {
    parle: 'baleine',
    arrivee: {
      '6e': 'Je suis la baleine. Je passe au large quand tu fais quelque chose de grand.',
      '5e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles Brumeuses : six îles, et les mêmes règles.',
      '4e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Anciens Ateliers : les vieux ateliers attendent qu’on les remette en marche.',
      '3e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles du Ciel : ici, les îles flottent dans les nuages.',
    },
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} brillent à nouveau. J’ai vu leur lumière depuis le large.`,
    // Le nom avec son article, « bâti » accordé (« La Plaine des nombres est bâtie. », « Le Marché des proportions est bâti. »).
    port: (ile) => `${thePlace(ile).charAt(0).toUpperCase()}${thePlace(ile).slice(1)} est ${agreeWithPlace(ile, 'bâti')}. Tu avances bien : chaque île bâtie rend l’archipel plus beau.`,
    ouvrage: (ile) => `Un chemin s’ouvre vers ${thePlace(ile)}. L’archipel s’agrandit.`,
  },
  // Le phare du large est dessiné pour Archipéo (revue d'ensemble, DA-4) : une tour ronde de pierre à feu ouvert.
  monuments: {
    'landmark-5e-1': {
      description: 'Une haute tour ronde de pierre grise, percée de hublots, dont le feu guide les navires dans la brume.',
      done: 'Le phare du large s’allume ! Plus aucun navire ne se perd dans la brume.',
    },
  },
  // Les commandes des habitants (GD-7), depuis la décision du 4 octobre 2026 (le gameplay de Blocland appliqué à
  // Archipéo) : l'habitant demande des blocs « pour bâtir chez lui ». Textes validés par le consultant d'Archipéo.
  commandes: {
    titre: 'Commandes',
    premiereFois: 'Un habitant te demande des blocs pour bâtir chez lui. Tu les livres quand tu veux.',
    livrer: 'Livrer',
    liste: 'Les commandes des habitants',
    compte: (n, pretes) => (pretes ? `${pretes} prête${s(pretes)}` : `${n} en attente`),
    tuEnAs: (have, count) => `Tu en as ${have} sur ${count}.`,
    tuYEs: 'Tu y es : joue une mission ici.',
  },
  // Les blocs assemblés et leur lieu (GD-2) : écrits dans docs/contenu/assemblage.md.
  blocs: nomsAssembles('archipeo'),
  // Une liaison s'appelle « ouvrage » à l'écran, partout (GD-9 : le mode « Aménager » et le menu aussi).
  liaisons: { nom: 'ouvrage', pluriel: 'ouvrages', feminin: false },
  reunion: {
    nom: 'La jetée',
    description: 'Une jetée de pierre, simple, d’une île à l’autre : on passe à pied.',
    fini: 'La jetée est posée ! On passe à pied d’une île à l’autre.',
  },
  assemblage: lieuDAssemblage('archipeo'),
  // Les noms d'avant GD-1, ceux des données (world/archipelago.ts).
  archipels: { '6e': 'Premiers Rivages', '5e': 'Îles Brumeuses', '4e': 'Anciens Ateliers', '3e': 'Îles du Ciel' },
  // Les rôles d'avant GD-1, ceux de core/progress.ts (ROLES), et leurs succès inchangés.
  roles: { explorateur: 'Explorateur', cartographe: 'Cartographe', batisseur: 'Bâtisseur', navigateur: 'Navigateur', architecte: 'Architecte de l’archipel' },
  succes: {},
  renommage: null,
} satisfies TextesUnivers;
