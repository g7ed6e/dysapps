// Les textes de Blocland. Depuis GD-8 (décision du mainteneur, 4 octobre 2026), les Gardiens ne sont plus vaincus :
// chacun se tient sur son îlot dès l'ouverture de son île, statue de cubes grise et éteinte, et son défi réussi le
// rallume en couleurs (chaque épreuve réussie rend les siennes à une partie de lui, en partant du bas). « Rallumer »
// remplace « vaincre » : chaque épreuve réussie nomme une partie du Gardien qui reprend sa couleur, chaque épreuve
// ratée commence par « Mes couleurs restent. », la réplique finale dit « Je me rallume ». GD-1 (« le chantier du
// bâtisseur », décidée le 30 septembre 2026) y ajoute sa voix et ses noms : la créature de l'île-école parle aux
// grandes étapes, les archipels reprennent leurs noms d'origine, les rôles sont des métiers du chantier. Textes du
// consultant de Blocland. Leur empreinte est vérifiée par src/universes/universes.test.ts.
import { ETATS_D_ILE, REPLIQUES } from '../common';
import type { TextesUnivers } from '../types';
import { lieuDAssemblage, nomsAssembles } from '../../game/world/assembly';

const s = (n: number) => (n > 1 ? 's' : '');

export const BLOCLAND = {
  gardiens: {
    'french-6e-phonology': {
      challenge: 'Le Grand Chêne craque : « Me voilà tout gris. Tu as bien écouté ma forêt : à toi de me rendre mes couleurs. »',
      guardianSays: {
        hit: 'Crac ! Un bloc de mon écorce reprend sa couleur. Tu as l’oreille fine.',
        miss: 'Mes couleurs restent. Tends l’oreille au prochain mot, et continue.',
        beaten: 'Je me rallume, vert des pieds à la tête ! La forêt est à toi, et à Mousso.',
      },
    },
    'french-6e-letter-confusion': {
      challenge: 'Le Golem de roche gronde doucement : « Ma gemme est grise, et mes lettres se ressemblent toutes. Toi, tu les reconnais ? »',
      guardianSays: {
        hit: 'Un bloc de ma roche reprend sa couleur. Tes yeux ne se trompent pas.',
        miss: 'Mes couleurs restent. Regarde bien la lettre, et reprends.',
        beaten: 'Je me rallume, de mes pieds jusqu’à ma gemme. Bien joué, bâtisseur.',
      },
    },
    'french-6e-word-spelling': {
      challenge: 'La Dune vivante siffle : « Mon sable est tout gris. Chaque mot bien écrit lui rend sa couleur. »',
      guardianSays: {
        hit: 'Une couche de sable redevient dorée. Ce mot était bien écrit.',
        miss: 'Mes couleurs restent. Le sable bouge, moi aussi : essaie le prochain mot.',
        beaten: 'Je me rallume, dorée jusqu’à la pointe. Le chemin est libre, bâtisseur.',
      },
    },
    'french-6e-grammar-spelling': {
      challenge: 'Le Taureau de terre frappe doucement le sol : « Me voilà tout gris. Ici, tout s’accorde : à toi de jouer. »',
      guardianSays: {
        hit: 'Meuh ! Un bloc de mon pelage reprend sa couleur. C’était bien accordé.',
        miss: 'Mes couleurs restent. Le prochain enclos t’attend.',
        beaten: 'Meuh ! Je me rallume, des sabots aux cornes. Tout s’accorde, bien joué.',
      },
    },
    'french-6e-reading': {
      challenge: 'La Chouette de verre cligne des yeux : « Mon verre est tout gris. Lis-moi à ton rythme : le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Hou… Un bloc de mes ailes redevient bleu. Tu lis bien.',
        miss: 'Mes couleurs restent. Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Hou hou ! Je me rallume, bleue jusqu’au bec. Le phare est à toi.',
      },
    },
    'maths-6e-calculation': {
      challenge: 'Le Hanneton de bronze bourdonne : « Me voilà tout gris. Tu as compté toute ma plaine : calcule avec moi. »',
      guardianSays: {
        hit: 'Bzzz… Juste ! Un bloc de ma carapace redevient bronze.',
        miss: 'Mes couleurs restent. Regarde les points, compte par cinq, et recommence.',
        beaten: 'Bzzz ! Je me rallume, des pattes aux antennes. La plaine est à toi, et à Coco.',
      },
    },
    'maths-6e-fractions': {
      challenge: 'Le Brochet d’argent fait des bulles : « Mes écailles sont toutes grises. Tu as partagé toute ma rivière : lis maintenant mes parts. »',
      guardianSays: {
        hit: 'Plouf ! Juste. Une part de mes écailles redevient argent.',
        miss: 'Mes couleurs restent. Regarde les parts ou l’opération posée, et reprends.',
        beaten: 'Glou ! Je me rallume, de la queue aux nageoires. La rivière est à toi, et à Nénu.',
      },
    },
    'maths-6e-decimals': {
      challenge: 'Le Dragon de cendre souffle une fumée tiède : « Même ma braise est grise. Tu as gravi tout mon volcan : lis chaque nombre rang par rang. »',
      guardianSays: {
        hit: 'Grrr… Exact. Un bloc de mon ventre redevient braise.',
        miss: 'Mes couleurs restent. Regarde le tableau ou la droite, rang par rang, et reprends.',
        beaten: 'Grrr ! Je me rallume, braise au ventre et yeux rouges. Le volcan est à toi, et à Lavi.',
      },
    },
    'maths-5e-signed-numbers': {
      challenge: 'Le Mammouth de givre barrit tout bas : « Mon poil est tout gris. Tu as traversé toute ma banquise : compte avec moi sous zéro. »',
      guardianSays: {
        hit: 'Brrr… Juste. Un bloc de mon poil redevient brun.',
        miss: 'Mes couleurs restent. Regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Brrr ! Je me rallume, du poil brun aux défenses blanches. Le glacier est à toi, et à Frimas.',
      },
    },
    'maths-5e-proportionality': {
      challenge: 'Le Colporteur pose sa besace : « Ma cape est toute grise. Tu as fait le tour de mes étals : faisons les comptes. »',
      guardianSays: {
        hit: 'Hé hé… Juste ! Un bloc de ma cape redevient violet.',
        miss: 'Mes couleurs restent. Passe par la valeur d’un seul, et reprends.',
        beaten: 'Hé hé ! Je me rallume, de la cape au chapeau. Le marché est à toi, et à Bazar.',
      },
    },
    'french-5e-homophones': {
      challenge: 'Le Sphinx des routes lève la tête : « Ma coiffe est toute grise. Tu as lu tous mes panneaux : montre-moi le bon chemin. »',
      guardianSays: {
        hit: 'Hmm… Juste. Un bloc de pierre reprend sa couleur.',
        miss: 'Mes couleurs restent. Relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Je me rallume, jusqu’à ma coiffe bleue et or. Toutes les routes sont à toi, et à Sema.',
      },
    },
    'french-5e-conjugation': {
      challenge: 'L’Hydre des marais sort de la vase : « Mes trois cous sont tout gris. Parle-moi du passé, du futur et du doute. »',
      guardianSays: {
        hit: 'Sss… Juste. Un bloc de mes cous redevient vert.',
        miss: 'Mes couleurs restent. Cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Sss ! Je me rallume, mes trois têtes aussi. Le marais est à toi, et à Kroa.',
      },
    },
    'maths-4e-powers': {
      challenge: 'Le Titan d’acier pose son marteau : « Mon cœur de forge est gris. Tu as chauffé toute ma forge : prends le temps de tes calculs. »',
      guardianSays: {
        hit: 'Clang ! Juste. Une plaque de mon armure reprend sa couleur.',
        miss: 'Mes couleurs restent. Relis la règle, compte les zéros, et reprends.',
        beaten: 'Clang ! Je me rallume, jusqu’à mon cœur de forge. La forge est à toi, et à Braise.',
      },
    },
    'maths-4e-algebra': {
      challenge: 'Le Golem des équations se tient bien droit : « Ma balance est toute grise. Tu as tracé tous mes plans : cherche l’inconnue avec moi. »',
      guardianSays: {
        hit: 'Égal… Juste. Un bloc de mon corps reprend sa couleur.',
        miss: 'Mes couleurs restent. Fais la même chose des deux côtés, et reprends.',
        beaten: 'Égal ! Je me rallume, jusqu’aux plateaux d’or. L’atelier est à toi, et à Ixe.',
      },
    },
    'french-4e-agreement': {
      challenge: 'Le Bélier de granit tape du sabot : « Me voilà tout gris. Tu as gravi toute ma paroi : accorde chaque mot avec soin. »',
      guardianSays: {
        hit: 'Boum… Juste. Un bloc de granit redevient rose.',
        miss: 'Mes couleurs restent. Cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Boum ! Je me rallume, jusqu’au bout des cornes. La falaise est à toi, et à Cléa.',
      },
    },
    'french-4e-vocabulary': {
      challenge: 'Le Hibou lexicographe ferme son dictionnaire : « Mes plumes sont toutes grises. Tu as ouvert tous mes tiroirs : démontons les mots. »',
      guardianSays: {
        hit: 'Hou… Juste. Un bloc de mes plumes redevient brun.',
        miss: 'Mes couleurs restent. Découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Hou ! Je me rallume, des lunettes au livre rouge. Le cabinet est à toi, et à Plume.',
      },
    },
    'maths-3e-geometry': {
      challenge: 'Le Sphinx de marbre se redresse : « Mon marbre est tout gris. Tu as mesuré tout mon belvédère : trouve ce qui manque. »',
      guardianSays: {
        hit: 'Hmm… Juste. Un bloc de marbre redevient blanc.',
        miss: 'Mes couleurs restent. Repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Je me rallume, blanc et bleu, rayé d’or. Toutes les longueurs sont à toi, et à Théo.',
      },
    },
    'maths-3e-statistics': {
      challenge: 'Le Comptable des étoiles ouvre son grand livre : « Ma robe est toute grise. Tu as relevé toutes mes séries : résumons-les. »',
      guardianSays: {
        hit: 'Tic… Juste. Un bloc de ma robe redevient violet.',
        miss: 'Mes couleurs restent. Range la série, compte les valeurs, et reprends.',
        beaten: 'Tic ! Je me rallume, jusqu’à l’étoile de mon chapeau. L’observatoire est à toi, et à Stat.',
      },
    },
    'maths-3e-functions': {
      challenge: 'Le Dragon de lumière replie ses ailes : « Mon or est tout gris. Tu as allumé tout mon phare : suis chaque nombre jusqu’à son image. »',
      guardianSays: {
        hit: 'Flash… Juste. Un bloc de mes écailles redevient or.',
        miss: 'Mes couleurs restent. Relis la formule ou le graphique, et reprends.',
        beaten: 'Flash ! Je me rallume, d’or et de verre. Le phare est à toi, et à Fi.',
      },
    },
    'french-3e-close-reading': {
      challenge: 'Le Grand Lecteur lève les yeux de son livre : « Ma robe est toute grise. Tu as observé tous mes textes : cherche ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Mmh… Juste. Un bloc de ma robe redevient bleu.',
        miss: 'Mes couleurs restent. Relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Je me rallume, jusqu’aux pages de mon livre. L’observatoire est à toi, et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    'english-6e-vocabulary': {
      challenge: 'Le Lion de pierre se dresse sur son socle : « Même mon regard d’or est gris. Tu as écouté tous les mots de la baie : montre-moi que tu les comprends. »',
      guardianSays: {
        hit: 'Rrr… Juste. Un bloc de ma crinière reprend sa couleur.',
        miss: 'Mes couleurs restent. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Rrr ! Je me rallume, jusqu’à mon regard d’or. La baie est à toi, et à Robin.',
      },
    },
    'english-6e-grammar': {
      challenge: 'Le Coucou de bronze sort de son horloge : « Mon cadran est tout gris. Tu as remonté tous mes rouages : vérifie chaque verbe avec moi. »',
      guardianSays: {
        hit: 'Coucou ! Juste. Une planche de mon horloge reprend sa couleur.',
        miss: 'Mes couleurs restent. Cherche le sujet, relis la règle, et reprends.',
        beaten: 'Coucou ! Je me rallume, du cadran au toit pointu. Les verbes sont à toi, et à Tick.',
      },
    },
    'english-5e-vocabulary': {
      challenge: 'La Reine du marché descend de son estrade : « Ma robe est toute grise. Tu as fait tes courses en anglais : écoute bien ce qu’on te dit. »',
      guardianSays: {
        hit: 'Juste ! Un bloc de ma robe redevient rouge.',
        miss: 'Mes couleurs restent. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Je me rallume, jusqu’à ma couronne d’or. Le Comptoir est à toi, et à Pudding.',
      },
    },
    'lv2-5e-introductions': {
      challenge: 'La Diligence de cuivre s’arrête devant l’auberge : « Mon cuivre est tout gris. Tu as accueilli tous mes voyageurs : écoute bien ce qu’ils te disent. »',
      guardianSays: {
        hit: 'Hue ! Juste. Une plaque de cuivre reprend sa couleur.',
        miss: 'Mes couleurs restent. Réécoute le mot, relis la règle, et reprends.',
        beaten: 'Hue ! Je me rallume, des roues aux lanternes. Le Relais est à toi, et à Lina.',
      },
    },
    'lv2-4e-daily-life': {
      challenge: 'Le Soleil de cuivre se lève au-dessus du jardin : « Mes rayons sont tout gris. Tu as suivi toute ma journée : dis-moi l’heure, et raconte ta journée. »',
      guardianSays: {
        hit: 'Juste. Un de mes rayons redevient cuivre.',
        miss: 'Mes couleurs restent. Réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Je me rallume, tous rayons dehors ! Le Jardin est à toi, et à Muscade.',
      },
    },
    'history-6e-antiquity': {
      challenge: 'L’Amphore peinte attend sur son îlot : « Mes bandes peintes sont toutes grises. Tu as fouillé toute l’île : remets chaque époque à sa place. »',
      guardianSays: {
        hit: 'Juste. Une bande de ma frise reprend sa couleur.',
        miss: 'Mes couleurs restent. Regarde la frise, du plus ancien au plus récent, et reprends.',
        beaten: 'Je me rallume, du pied jusqu’au col. La Fouille est à toi, et à Silex.',
      },
    },
    'geography-6e-living': {
      challenge: 'Le Castor de glaise lève la tête : « Me voilà tout gris. Tu as vu tous les paysages de la Pointe : dis-moi où vivent les humains. »',
      guardianSays: {
        hit: 'Juste. Un bloc de mon pelage redevient ocre.',
        miss: 'Mes couleurs restent. Relis le document, cherche le mot du rappel, et reprends.',
        beaten: 'Je me rallume, de la queue jusqu’aux oreilles. La Pointe est à toi, et à Boussole.',
      },
    },
    'life-earth-sciences-6e-living-world': {
      challenge: 'Le Cerf des sous-bois baisse la tête : « Me voilà tout gris. Tu as parcouru toute ma vallée : range chaque être vivant à sa place. »',
      guardianSays: {
        hit: 'Juste. Un bloc de mon dos reprend sa couleur.',
        miss: 'Mes couleurs restent. Relis le document, regarde le groupe, et reprends.',
        beaten: 'Je me rallume, des sabots jusqu’aux bois. La Vallée est à toi, et à Fougère.',
      },
    },
    'physics-chemistry-6e-matter-energy': {
      challenge: 'L’Alambic de verre fait une petite bulle : « Mon ballon est tout gris. Tu as fait toutes mes expériences : aide-moi à les comprendre. »',
      guardianSays: {
        hit: 'Juste. Une bulle de mon ballon reprend sa couleur.',
        miss: 'Mes couleurs restent. Regarde l’instrument, cherche le mot du rappel, et reprends.',
        beaten: 'Blop ! Je me rallume, du pied jusqu’au bec. Le Laboratoire est à toi, et à Bulle.',
      },
    },
    'technology-6e-objects': {
      challenge: 'L’Automate de laiton fait tourner sa clé : « Me voilà tout gris. Tu as ouvert tous mes objets : dis-moi à quoi ils servent. »',
      guardianSays: {
        hit: 'Juste. Un bouton de ma poitrine reprend sa couleur.',
        miss: 'Mes couleurs restent. Regarde le schéma, relis la légende, et reprends.',
        beaten: 'Clic ! Je me rallume, des pieds jusqu’à la clé. Le Hangar est à toi, et à Pince.',
      },
    },
    'lv2-3e-travel': {
      challenge: 'Le Papillon de cuivre attend devant le refuge : « Mes ailes sont toutes grises. Tu as rencontré tous les voyageurs du refuge : dis-moi ce qu’ils ont vécu. »',
      guardianSays: {
        hit: 'Juste. Un bloc de mes ailes redevient cuivre.',
        miss: 'Mes couleurs restent. Lis bien la question, relis la règle, et reprends.',
        beaten: 'Je me rallume, jusqu’au bout des antennes. Le refuge est à toi, et à Timbre.',
      },
    },
    'english-5e-grammar': {
      challenge: 'Le Spectre du manoir traverse le mur : « Mon drap est tout gris. Tu as fouillé toutes mes pièces : dis-moi maintenant, hier, et plus fort que moi. »',
      guardianSays: {
        hit: 'Bouh… Juste. Un bloc de mon drap redevient blanc.',
        miss: 'Mes couleurs restent. Cherche le mot du temps, comme now ou yesterday, relis la règle, et reprends.',
        beaten: 'Bouh ! Je me rallume, blanc comme un drap propre. Le manoir est à toi, et à Moustache.',
      },
    },
    'english-4e-comprehension': {
      challenge: 'Le Masque descend des cintres : « Mes rubans sont tout gris. Tu connais toutes mes répliques : donne la bonne. »',
      guardianSays: {
        hit: 'Juste ! Un de mes rubans redevient violet. La salle applaudit.',
        miss: 'Mes couleurs restent. Réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Je me rallume, blanc, or et violet. Le théâtre est à toi, et à Puck.',
      },
    },
    'english-4e-grammar': {
      challenge: 'La Locomotive de fer entre en gare : « Mes roues sont toutes grises. Tu as pris tous mes trains : montre-moi où tu vas. »',
      guardianSays: {
        hit: 'Tchou ! Juste. Une de mes roues redevient rouge.',
        miss: 'Mes couleurs restent. Cherche le petit mot, comme will, can ou already, relis la règle, et reprends.',
        beaten: 'Tchou ! Je me rallume, jusqu’à la fumée. Les voies sont à toi, et à Vapeur.',
      },
    },
    'english-3e-comprehension': {
      challenge: 'La Grande Antenne grésille : « Mes cadrans sont tout gris. Tu as capté toutes mes ondes : écoute chaque message. »',
      guardianSays: {
        hit: 'Bip… Juste. Un bloc de mon poste reprend sa couleur.',
        miss: 'Mes couleurs restent. Relis le texte, cherche l’indice, et reprends.',
        beaten: 'Bip bip ! Je me rallume, jusqu’au voyant rouge. Le studio est à toi, et à Écho.',
      },
    },
    'english-3e-grammar': {
      challenge: 'Le Dragon gallois se pose sur le donjon : « Me voilà tout gris. Tu as franchi tous mes remparts : lis les phrases les plus longues à ton rythme. »',
      guardianSays: {
        hit: 'Grrr… Juste. Un bloc de mes écailles redevient rouge.',
        miss: 'Mes couleurs restent. Cherche le petit mot, comme for, since, if ou by, relis la règle, et reprends.',
        beaten: 'Grrr ! Je me rallume, rouge et or, ailes violettes. Le château est à toi, et à Knight.',
      },
    },
  },
  creatures: REPLIQUES,
  // Les îles de Blocland ne sont pas en ruine : on les bâtit. « Restaurée » reste le mot d'Archipéo (DP-01, DP-02) ;
  // l'identifiant, l'icône et la place ne changent pas (décision du mainteneur, 28 septembre 2026).
  etatsDIle: { ...ETATS_D_ILE, restauree: 'Bâtie' },
  especes: {
    'french-6e-phonology': 'golem de mousse',
    'french-6e-letter-confusion': 'taupe cubique',
    'french-6e-word-spelling': 'renard cubique',
    'french-6e-grammar-spelling': 'vache carrée',
    'french-6e-reading': 'hibou de pierre',
    'maths-6e-calculation': 'coccinelle à dix points',
    'maths-6e-fractions': 'grenouille des nénuphars',
    'maths-6e-decimals': 'salamandre de lave',
    'maths-5e-signed-numbers': 'pingouin comptable',
    'maths-5e-proportionality': 'raton laveur marchand',
    'french-5e-homophones': 'caméléon des panneaux',
    'french-5e-conjugation': 'triton des roseaux',
    'maths-4e-powers': 'golem forgeron',
    'maths-4e-algebra': 'robot dessinateur',
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
    'history-6e-antiquity': 'ourson fouilleur',
    'geography-6e-living': 'tortue géographe',
    'life-earth-sciences-6e-living-world': 'escargot jardinier',
    'physics-chemistry-6e-matter-energy': 'goutte chimiste',
    'technology-6e-objects': 'fourmi bricoleuse',
    'english-5e-grammar': 'chat du manoir',
    'english-4e-comprehension': 'lutin souffleur',
    'english-4e-grammar': 'blaireau chef de gare',
    'english-3e-comprehension': 'chauve-souris animatrice radio',
    'english-3e-grammar': 'petit chevalier',
  },
  libelles: {
    dejaFait: 'Déjà rallumé. On rejoue ?',
    etoiles: 'Gardien rallumé',
    etoilesSur3: (etoiles) => `Gardien rallumé : ${etoiles} étoile${s(etoiles)} sur 3`,
    resistance: (reste, total) => `Encore ${reste} épreuve${s(reste)} sur ${total} pour lui rendre ses couleurs`,
    dejaFaitArene: (gardien) => `${gardien} a déjà ses couleurs. Tu peux rejouer son défi quand tu veux.`,
    encoreAFaire: (n) => `encore ${n} Gardien${s(n)} à rallumer`,
    navireAttend: (n, piece) => `Le Bloc-Navire a tous ses blocs ! Il attend encore ${n} Gardien${s(n)} rallumé${s(n)}${piece ? ` pour ${piece}` : ''}.`,
    navireGardiens: (faits, total, archipel, piece) =>
      faits >= total ? `Gardiens : c’est fait ! ${faits} sur ${total}, ${piece} est là.` : `Gardiens : encore ${total - faits} à rallumer dans les ${archipel} pour ${piece}.`,
    faitsSur: (n, total) => `${n} Gardien${s(n)} rallumé${s(n)} sur ${total}`,
    progres: (n, total) => `${n} / ${total} Gardiens rallumés`,
    defiPret: 'Le Gardien est prêt : à toi de le rallumer !',
    defiPretCourt: 'Défi prêt',
    arene: (gardien) => `Rallumer ${gardien}`,
    decouverteOuvrages:
      'Les îles pâles sont fermées. Pour y venir, pose un ouvrage. Il part de l’île de ton choix. Chaque ouvrage coûte le même nombre de blocs.',
    navireGardiensManquants: (n, archipel) => `rallume encore ${n} Gardien${s(n)} des ${archipel}`,
    decouverteNavire: 'Ici, au port, le Bloc-Navire attend ses blocs. Quand il est prêt, embarque : un autre archipel t’attend, et tu peux toujours revenir.',
  },
  // Les couleurs ne disent que les réussites : « lui rendre ses couleurs », sans accord selon le Gardien (GD-8).
  sentinelles: {
    consigne: 'Chaque épreuve réussie rend ses couleurs à une partie du Gardien, en partant du bas. Une épreuve ratée lui laisse ses couleurs. Prends ton temps : personne ne compte les secondes.',
    regle: 'Une épreuve ratée lui laisse ses couleurs.',
    jauge: 'Épreuves réussies',
    compte: (reussies, total) => `${reussies} sur ${total}`,
    seuil: (n, assez) => (assez ? 'C’est assez pour lui rendre ses couleurs.' : `Il faut ${n} épreuves réussies pour lui rendre ses couleurs.`),
    jaugeLue: (reussies, total, n) => `${reussies} épreuve${s(reussies)} réussie${s(reussies)} sur ${total}, il en faut ${n}`,
    rallume: (gardien) => `${gardien} se rallume en couleurs !`,
  },
  // Les monuments qui nomment un archipel : le même message, avec le nom de Blocland.
  monuments: {
    'landmark-6e-2': { done: 'Le grand moulin tourne ! Il moud le grain de toutes les îles des Basses Terres.' },
    'landmark-4e-2': { done: 'L’amphithéâtre est prêt ! Tout le monde des Monts de Feu viendra au spectacle.' },
  },
  // Les blocs assemblés et leur lieu (GD-2) : écrits dans docs/contenu/assemblage.md.
  // La créature qui se souvient (GD-4, étape 1) : sa proposition, au tutoiement complice de Blocland.
  rappel: (mission) => `J’ai gardé « ${mission} » de côté. On s’y remet ensemble ?`,
  // Les commandes des habitants (GD-7, PR 3) : « commande » (la « demande » est la mission depuis GD-5) et « petite
  // construction » (« ouvrage » est réservé aux liaisons), mots du directeur artistique (3 octobre 2026).
  commandes: {
    titre: 'Commandes',
    premiereFois: 'Une commande, c’est une créature qui te demande des blocs pour une petite construction. Rien ne presse.',
    livrer: 'Livrer',
    liste: 'Les commandes des créatures',
    compte: (n, pretes) => (pretes ? `${pretes} prête${pretes > 1 ? 's' : ''}` : `${n} en attente`),
    tuEnAs: (have, count) => `Tu en as ${have} sur ${count}.`,
    tuYEs: 'Tu y es : joue une mission ici.',
  },
  blocs: nomsAssembles('blocland'),
  // Une liaison s'appelle « ouvrage » à l'écran, partout (GD-9 : le mode « Aménager » et le menu aussi).
  liaisons: { nom: 'ouvrage', pluriel: 'ouvrages', feminin: false },
  reunion: {
    nom: 'La digue',
    description: 'Une digue de cubes d’herbe sur la pierre, d’un lieu à l’autre : on passe à pied.',
    fini: 'La digue tient bon ! On passe à pied d’un lieu à l’autre.',
  },
  assemblage: lieuDAssemblage('blocland'),
  // La créature de l'île-école de l'archipel parle : Mousso en 6e, Bazar en 5e, Ixe en 4e, Fi en 3e (GD-1, point 1).
  baleine: {
    parle: 'ecole',
    arrivee: {
      '6e': 'Salut, bâtisseur ! Moi, c’est Mousso, un golem de mousse. Ici, tout se bâtit bloc par bloc, et je t’aide.',
      '5e': 'Le Bloc-Navire a fait sa traversée ! Moi, c’est Bazar, le raton laveur du marché. Bienvenue dans les Collines du Large : ici, on compte ses blocs avant de bâtir.',
      '4e': 'Bip. Le Bloc-Navire a fait sa traversée. Moi, c’est Ixe, le robot dessinateur. Bienvenue dans les Monts de Feu : ici, le feu du volcan fait tourner les machines. À toi d’en bâtir !',
      '3e': 'Le Bloc-Navire a fait sa traversée. Moi, c’est Fi, la lampe du phare. Bienvenue dans les Îles du Ciel : je t’éclaire, bâtisseur, on bâtit tout en haut.',
    },
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} ont retrouvé leurs couleurs ! Ils veillent sur ton chantier.`,
    port: (ile) => `Chantier fini : ${ile} ! Bloc après bloc, ton archipel grandit.`,
    ouvrage: (ile) => `Ton ouvrage tient bon ! Nouvelle île ouverte : ${ile}.`,
  },
  // Les noms d'origine des archipels de Blocland (GD-1, point 2) ; les Îles du Ciel ne changent pas.
  archipels: { '6e': 'Basses Terres', '5e': 'Collines du Large', '4e': 'Monts de Feu', '3e': 'Îles du Ciel' },
  // Des métiers qui vont de la construction à l'ingénierie (GD-1, point 3) ; « bâtisseur » reste le nom que les
  // créatures donnent à l'élève.
  roles: { explorateur: 'Apprenti', cartographe: 'Maçon', batisseur: 'Mécanicien', navigateur: 'Ingénieur', architecte: 'Architecte' },
  succes: {
    'rang-argent': { title: 'Maçon', description: 'Devenir Maçon : tu poses les blocs bien droits.' },
    'rang-or': { title: 'Mécanicien', description: 'Devenir Mécanicien : tu fais tourner les machines.' },
    'rang-diamant': { title: 'Ingénieur', description: 'Devenir Ingénieur : tu inventes des machines.' },
    'rang-legende': { title: 'Architecte', description: 'Devenir Architecte : tu dessines les plans du village.' },
    aeronaute: { title: 'Aéronaute', description: 'Gonfler le ballon du Bloc-Navire et rejoindre les Monts de Feu.' },
  },
  // Dit une fois par appareil, à un élève qui jouait déjà avant les nouveaux noms (src/game/Renaming.tsx).
  renommage: {
    titre: 'De nouveaux noms',
    intro: 'Dans Blocland, trois archipels reprennent leur nom d’origine. Tes blocs, tes étoiles et tes bâtiments ne changent pas.',
    lignes: [
      'Les Premiers Rivages s’appellent maintenant les Basses Terres.',
      'Les Îles Brumeuses s’appellent maintenant les Collines du Large.',
      'Les Anciens Ateliers s’appellent maintenant les Monts de Feu.',
    ],
    bouton: 'D’accord',
  },
} satisfies TextesUnivers;
