// Les textes de Blocland : ceux d'avant le lot 6, déplacés sans un mot changé (Blocland garde « vaincre », le Gardien
// vaincu et sa statue). Leur invariance est vérifiée par src/univers/univers.test.ts. GD-1 (« le chantier du
// bâtisseur », décidée le 30 septembre 2026) y ajoute sa voix et ses noms : la créature de l'île-école parle aux
// grandes étapes, les archipels reprennent leurs noms d'origine, les rôles sont des métiers du chantier. Textes du
// consultant de Blocland.
import { ETATS_D_ILE, REPLIQUES } from '../communs';
import type { TextesUnivers } from '../types';
import { lieuDAssemblage, nomsAssembles } from '../../blocland/world/assemblage';

const s = (n: number) => (n > 1 ? 's' : '');

export const BLOCLAND = {
  gardiens: {
    'french-6e-phonology': {
      challenge: 'Le Grand Chêne craque : « Tu as bien écouté ma forêt. Montre-moi tout ce que tu sais faire. »',
      guardianSays: {
        hit: 'Mes branches tremblent. Tu as l’oreille fine.',
        miss: 'Ce n’est rien : même le vent se trompe de feuille. Continue.',
        beaten: 'Je m’incline, bâtisseur. La forêt est à toi… et à Mousso.',
      },
    },
    'french-6e-letter-confusion': {
      challenge: 'Le Golem de roche gronde : « Mes lettres se ressemblent toutes. Toi, tu les reconnais ? Prouve-le. »',
      guardianSays: {
        hit: 'Une fissure ! Tes yeux ne se trompent pas.',
        miss: 'Ma roche est dure, mais tu peux la reprendre. Regarde bien.',
        beaten: 'Je m’écroule… en pierres pour ton village. Bien joué.',
      },
    },
    'french-6e-word-spelling': {
      challenge: 'La Dune vivante siffle : « Chaque mot bien écrit me fait reculer. Écris juste, et je te laisserai passer. »',
      guardianSays: {
        hit: 'Je recule d’un pas. Ce mot était bien écrit.',
        miss: 'Le sable bouge, moi aussi. Réessaie au prochain mot.',
        beaten: 'Je me couche sur la plage. Le chemin est libre, bâtisseur.',
      },
    },
    'french-6e-grammar-spelling': {
      challenge: 'Le Taureau de terre frappe le sol : « Ici, tout s’accorde ou tout s’écroule. À toi de jouer. »',
      guardianSays: {
        hit: 'Meuh ! Mes sabots glissent. C’était bien accordé.',
        miss: 'Tout le monde trébuche parfois. Le prochain enclos est à toi.',
        beaten: 'Je m’assieds dans l’herbe. Tout s’accorde, tu as gagné.',
      },
    },
    'french-6e-reading': {
      challenge: 'La Chouette de verre cligne des yeux : « Lis-moi, à ton rythme. Le phare t’attend en haut. »',
      guardianSays: {
        hit: 'Hou… Tu lis mieux que je ne vois la nuit.',
        miss: 'Lire lentement, c’est lire quand même. Reprends ton souffle.',
        beaten: 'Hou hou. Le phare est à toi. Je te confie la nuit.',
      },
    },
    'maths-6e-calculation': {
      challenge: 'Le Hanneton de bronze bourdonne : « Tu as compté toute ma plaine. Montre-moi ce que tu sais calculer. »',
      guardianSays: {
        hit: 'Bzzz… Juste ! Mes ailes de bronze grincent.',
        miss: 'Ce n’est rien : regarde les points, compte par cinq, et recommence.',
        beaten: 'Bzzz. Tu calcules plus vite que mes ailes. La plaine est à toi… et à Coco.',
      },
    },
    'maths-6e-fractions': {
      challenge: 'Le Brochet d’argent fend l’eau : « Tu as partagé toute ma rivière. Montre-moi comment tu lis les parts. »',
      guardianSays: {
        hit: 'Plouf ! Juste. Mes écailles frissonnent.',
        miss: 'Ce n’est rien : regarde les parts ou l’opération posée, et reprends.',
        beaten: 'Glou. Tu partages mieux que la rivière elle-même. Elle est à toi… et à Nénu.',
      },
    },
    'maths-6e-decimals': {
      challenge: 'Le Dragon de cendre gronde : « Tu as gravi tout mon volcan. Montre-moi comment tu lis la virgule. »',
      guardianSays: {
        hit: 'Grrr… Exact. Ma fumée se dissipe.',
        miss: 'Ce n’est rien : regarde le tableau ou la droite, rang par rang, et reprends.',
        beaten: 'Grrr. Tu lis les rangs mieux que mes flammes. Le volcan est à toi… et à Lavi.',
      },
    },
    'maths-5e-signed-numbers': {
      challenge: 'Le Mammouth de givre barrit : « Tu as traversé toute ma banquise. Montre-moi comment tu comptes sous zéro. »',
      guardianSays: {
        hit: 'Brrr… Juste. Mes défenses en tremblent.',
        miss: 'Ce n’est rien : regarde la droite, zéro au milieu, et reprends.',
        beaten: 'Brrr. Tu comptes même sous zéro. Le glacier est à toi… et à Frimas.',
      },
    },
    'maths-5e-proportionality': {
      challenge: 'Le Colporteur pose sa besace : « Tu as fait le tour de mes étals. Montre-moi comment tu fais les comptes. »',
      guardianSays: {
        hit: 'Hé hé… Juste ! Tu sais compter tes sous.',
        miss: 'Ce n’est rien : passe par la valeur d’un seul, et reprends.',
        beaten: 'Hé hé. Tu marchandes mieux que moi. Le marché est à toi… et à Bazar.',
      },
    },
    'french-5e-homophones': {
      challenge: 'Le Sphinx des routes se dresse : « Tu as lu tous mes panneaux. Montre-moi que tu ne te trompes plus de chemin. »',
      guardianSays: {
        hit: 'Hmm… Juste. Tu connais le chemin des mots.',
        miss: 'Ce n’est rien : relis la règle sur le panneau, remplace le mot, et reprends.',
        beaten: 'Je m’écarte. Toutes les routes sont à toi… et à Sema.',
      },
    },
    'french-5e-conjugation': {
      challenge: 'L’Hydre des marais sort de la vase : « Tu as traversé mes trois eaux. Montre-moi que tu connais le passé, le futur et le doute. »',
      guardianSays: {
        hit: 'Sss… Juste. Une de mes têtes s’incline.',
        miss: 'Ce n’est rien : cherche l’indice de temps dans la phrase, et reprends.',
        beaten: 'Sss. Mes trois têtes se taisent. Le marais est à toi… et à Kroa.',
      },
    },
    'maths-4e-powers': {
      challenge: 'Le Titan d’acier lève son marteau : « Tu as chauffé toute ma forge. Montre-moi la puissance de tes calculs. »',
      guardianSays: {
        hit: 'Clang ! Juste. Mon armure sonne creux.',
        miss: 'Ce n’est rien : relis la règle, compte les zéros, et reprends.',
        beaten: 'Clang. Tu frappes plus fort que mon marteau. La forge est à toi… et à Braise.',
      },
    },
    'maths-4e-algebra': {
      challenge: 'Le Golem des équations se met en équilibre : « Tu as tracé tous mes plans. Montre-moi que tu sais trouver l’inconnue. »',
      guardianSays: {
        hit: 'Égal… Juste. Mes deux plateaux sont à niveau.',
        miss: 'Ce n’est rien : fais la même chose des deux côtés, et reprends.',
        beaten: 'Égal. Tu as trouvé tous mes x. L’atelier est à toi… et à Ixe.',
      },
    },
    'french-4e-agreement': {
      challenge: 'Le Bélier de granit frappe le rocher : « Tu as gravi toute ma paroi. Montre-moi que tes accords tiennent la corde. »',
      guardianSays: {
        hit: 'Boum… Juste. Mes cornes s’émoussent.',
        miss: 'Ce n’est rien : cherche le sujet, cherche le complément, et reprends.',
        beaten: 'Boum. Tu grimpes plus sûrement que moi. La falaise est à toi… et à Cléa.',
      },
    },
    'french-4e-vocabulary': {
      challenge: 'Le Hibou lexicographe ferme son dictionnaire : « Tu as ouvert tous mes tiroirs. Montre-moi que tu sais démonter les mots. »',
      guardianSays: {
        hit: 'Hou… Juste. Tu as lu jusqu’à la racine.',
        miss: 'Ce n’est rien : découpe le mot, cherche le petit morceau connu, et reprends.',
        beaten: 'Hou. Tu connais mes mots mieux que mon dictionnaire. Le cabinet est à toi… et à Plume.',
      },
    },
    'maths-3e-geometry': {
      challenge: 'Le Sphinx de marbre se redresse : « Tu as mesuré tout mon belvédère. Montre-moi que tu trouves ce qui manque. »',
      guardianSays: {
        hit: 'Hmm… Juste. L’angle droit te salue.',
        miss: 'Ce n’est rien : repère l’hypoténuse, écris l’égalité, et reprends.',
        beaten: 'Je m’incline. Toutes les longueurs sont à toi… et à Théo.',
      },
    },
    'maths-3e-statistics': {
      challenge: 'Le Comptable des étoiles ouvre son grand livre : « Tu as relevé toutes mes séries. Montre-moi que tu sais les résumer. »',
      guardianSays: {
        hit: 'Tic… Juste. Une étoile de plus dans ma colonne.',
        miss: 'Ce n’est rien : range la série, compte les valeurs, et reprends.',
        beaten: 'Tic. Tu comptes les étoiles mieux que moi. L’observatoire est à toi… et à Stat.',
      },
    },
    'maths-3e-functions': {
      challenge: 'Le Dragon de lumière déploie ses ailes : « Tu as allumé tout mon phare. Montre-moi que tu suis la lumière de x jusqu’à f(x). »',
      guardianSays: {
        hit: 'Flash… Juste. Ma lumière trouve son image.',
        miss: 'Ce n’est rien : relis la formule ou le graphique, et reprends.',
        beaten: 'Flash. Tu éclaires plus loin que moi. Le phare est à toi… et à Fi.',
      },
    },
    'french-3e-close-reading': {
      challenge: 'Le Grand Lecteur lève les yeux de son livre : « Tu as observé tous mes textes. Montre-moi que tu vois ce qu’ils cachent. »',
      guardianSays: {
        hit: 'Mmh… Juste. Tu lis ce qui n’est pas écrit.',
        miss: 'Ce n’est rien : relis la phrase, cherche l’indice, et reprends.',
        beaten: 'Je ferme mon livre. L’observatoire est à toi… et à Astra. Tu sais lire, vraiment lire.',
      },
    },
    'english-6e-vocabulary': {
      challenge: 'Le Lion de pierre se dresse sur son socle : « Tu as écouté tous les mots de la baie. Montre-moi que tu les comprends. »',
      guardianSays: {
        hit: 'Rrr… Juste. Tu as l’oreille anglaise.',
        miss: 'Ce n’est rien : réécoute le mot, relis la règle, et reprends.',
        beaten: 'Je me recouche sur mon socle. La baie est à toi… et à Robin. Well done!',
      },
    },
    'english-6e-grammar': {
      challenge: 'Le Coucou de bronze jaillit de son horloge : « Tu as remonté tous mes rouages. Montre-moi que tes verbes sonnent juste. »',
      guardianSays: {
        hit: 'Coucou ! Juste. Ton verbe est à l’heure.',
        miss: 'Ce n’est rien : cherche le sujet, relis la règle, et reprends.',
        beaten: 'Coucou… Je rentre dans mon horloge. Les verbes sont à toi… et à Tick.',
      },
    },
    'english-5e-vocabulary': {
      challenge: 'La Reine du marché descend de son estrade : « Tu as fait toutes tes courses en anglais. Montre-moi que tu comprends tout ce qu’on te dit. »',
      guardianSays: {
        hit: 'Splendid! Juste. Tu parles comme au marché de Londres.',
        miss: 'Ce n’est rien : réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Je range ma couronne. Le Comptoir est à toi… et à Pudding.',
      },
    },
    'lv2-5e-introductions': {
      challenge: 'La Diligence de cuivre s’arrête devant l’auberge : « Tu as accueilli tous mes voyageurs. Montre-moi que tu comprends ce qu’ils te disent. »',
      guardianSays: {
        hit: 'Hue ! Juste. Mes roues tournent rond.',
        miss: 'Ce n’est rien : réécoute le mot, relis la règle, et reprends.',
        beaten: 'Je dételle mes chevaux. Le Relais est à toi… et à Lina.',
      },
    },
    'lv2-4e-daily-life': {
      challenge: 'Le Soleil de cuivre se lève au-dessus du jardin : « Tu as suivi toute ma journée, du matin au soir. Montre-moi que tu sais dire l’heure et raconter ta journée. »',
      guardianSays: {
        hit: 'Juste. Je descends un peu vers le soir.',
        miss: 'Ce n’est rien : réécoute la phrase, relis la règle, et reprends.',
        beaten: 'Je me couche… en pierre, pour ton village. Le Jardin est à toi… et à Muscade.',
      },
    },
    'lv2-3e-travel': {
      challenge: 'Le Papillon de cuivre attend devant le refuge : « Tu as rencontré tous les voyageurs du refuge. Montre-moi que tu comprends leurs voyages. »',
      guardianSays: {
        hit: 'Juste. Je me souviens : avant, j’étais chenille.',
        miss: 'Ce n’est rien : lis bien la question, relis la règle, et reprends.',
        beaten: 'Je me pose… en pierre, pour ton village. Le refuge est à toi… et à Timbre.',
      },
    },
    'english-5e-grammar': {
      challenge: 'Le Spectre du manoir traverse le mur : « Tu as fouillé toutes mes pièces. Montre-moi que tu sais dire maintenant, hier, et plus fort que moi. »',
      guardianSays: {
        hit: 'Bouh… Juste. Tu ne crains pas le passé.',
        miss: 'Ce n’est rien : cherche le mot du temps (now, yesterday…), relis la règle, et reprends.',
        beaten: 'Je m’efface… Le manoir est à toi… et à Moustache.',
      },
    },
    'english-4e-comprehension': {
      challenge: 'Le Masque descend des cintres : « Tu connais toutes mes répliques. Montre-moi que tu sais donner la bonne. »',
      guardianSays: {
        hit: 'Bravo! Juste. La salle applaudit.',
        miss: 'Ce n’est rien : réécoute la réplique, relis la règle, et reprends.',
        beaten: 'Le rideau tombe. Le théâtre est à toi… et à Puck.',
      },
    },
    'english-4e-grammar': {
      challenge: 'La Locomotive de fer entre en gare dans un nuage de vapeur : « Tu as pris tous mes trains. Montre-moi que tu sais où tu vas. »',
      guardianSays: {
        hit: 'Tchou ! Juste. Tu es sur les bons rails.',
        miss: 'Ce n’est rien : cherche le petit mot (will, can, already…), relis la règle, et reprends.',
        beaten: 'Je m’arrête en gare. Les voies sont à toi… et à Vapeur.',
      },
    },
    'english-3e-comprehension': {
      challenge: 'La Grande Antenne grésille et s’allume : « Tu as capté toutes mes ondes. Montre-moi que tu comprends chaque message. »',
      guardianSays: {
        hit: 'Bip… Juste. Message bien reçu.',
        miss: 'Ce n’est rien : relis le texte, cherche l’indice, et reprends.',
        beaten: 'Fin de l’émission. Le studio est à toi… et à Écho.',
      },
    },
    'english-3e-grammar': {
      challenge: 'Le Dragon gallois se pose sur le donjon : « Tu as franchi tous mes remparts. Montre-moi que tu maîtrises les phrases les plus longues. »',
      guardianSays: {
        hit: 'Grrr… Juste. Ma flamme vacille.',
        miss: 'Ce n’est rien : cherche le petit mot (for, since, if, by…), relis la règle, et reprends.',
        beaten: 'Je replie mes ailes rouges. Le château est à toi… et à Knight.',
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
    'english-5e-grammar': 'chat du manoir',
    'english-4e-comprehension': 'lutin souffleur',
    'english-4e-grammar': 'blaireau chef de gare',
    'english-3e-comprehension': 'chauve-souris animatrice radio',
    'english-3e-grammar': 'petit chevalier',
  },
  libelles: {
    dejaFait: 'Déjà vaincu. Une revanche ?',
    etoiles: 'Gardien vaincu',
    etoilesSur3: (etoiles) => `Gardien vaincu : ${etoiles} étoiles sur 3`,
    resistance: (reste, total) => `${reste} épreuves sur ${total} avant de le vaincre`,
    dejaFaitArene: (gardien) => `${gardien} est déjà vaincu, mais il aime les revanches.`,
    encoreAFaire: (n) => `encore ${n} Gardien${s(n)} à vaincre`,
    navireAttend: (n, piece) => `Le Bloc-Navire a tous ses blocs ! Il attend encore ${n} Gardien${s(n)} vaincu${s(n)}${piece ? ` pour ${piece}` : ''}.`,
    navireGardiens: (faits, total, archipel, piece) =>
      faits >= total ? `Gardiens : c’est fait ! ${faits} sur ${total}, ${piece} est là.` : `Gardiens : encore ${total - faits} à vaincre dans les ${archipel} pour ${piece}.`,
    faitsSur: (n, total) => `${n} Gardien${s(n)} vaincu${s(n)} sur ${total}`,
    progres: (n, total) => `${n} / ${total} Gardiens vaincus`,
    defiPret: 'Le Gardien accepte ton défi !',
    defiPretCourt: 'Prêt à t’affronter',
    defiFerme: (gardien, etoiles) => `${gardien} n’accepte que les bâtisseurs entraînés. Obtiens ${etoiles} étoiles dans chaque mission, puis reviens.`,
    arene: () => 'L’arène du Gardien',
    decouverteOuvrages:
      'Les îles pâles sont fermées. Pour y venir, construis un ouvrage. Chaque ouvrage se paie en blocs. Un escalier demande aussi une mission réussie.',
    navireGardiensManquants: (n, archipel) => `bats encore ${n} Gardien${s(n)} des ${archipel}`,
    decouverteNavire: 'Ici, au port, le Bloc-Navire attend ses blocs. Quand il est prêt, embarque : un autre archipel t’attend, et tu peux toujours revenir.',
  },
  sentinelles: null,
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
    gardiens: (archipel) => `Tous les Gardiens des ${archipel} sont vaincus ! Leurs statues gardent maintenant ton chantier.`,
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
  // Dit une fois par appareil, à un élève qui jouait déjà avant les nouveaux noms (src/blocland/Renommage.tsx).
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
