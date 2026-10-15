// Les textes communs aux deux univers d'aujourd'hui (étape J8 de U4, docs/univers/univers.md §5), déplacés sans un
// mot changé : les répliques des créatures (de src/game/biomes.ts) et le mot de chaque état d'île (de
// src/game/world/islandState.ts). Chaque univers les reprend dans ses textes ; il peut les remplacer (Blocland
// remplace « Restaurée » par « Bâtie »).
import type { BiomeId } from '../game/biomes';
import type { IslandStateId } from '../game/world/islandState';
import type { TextesCreature } from './types';

/** Le mot de chaque état d'île, sur la Carte et dans le panneau d'une île, toujours avec son icône. */
export const ETATS_D_ILE: Record<IslandStateId, string> = {
  fermee: 'Fermée',
  'a-explorer': 'À explorer',
  'en-chantier': 'En chantier',
  restauree: 'Restaurée',
};

/**
 * La phrase commune de la créature qui propose les révisions dues (GD-4, étape 1), quand l'univers n'a pas la sienne :
 * une seule phrase, sans échec ni date, rien qui presse.
 */
export const RAPPEL = (mission: string) => `On reprend « ${mission} » ensemble ?`;

/** Ce que disent les créatures, île par île. */
export const REPLIQUES: Record<BiomeId, TextesCreature> = {
  'french-6e-phonology': {
    greeting: 'Salut, bâtisseur ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
    lines: [
      'Tu entends ? Le vent coupe les mots en syllabes.',
      'Ma cabane a besoin de bois. Viens chasser les sons !',
      'Chaque arbre ici a poussé sur une rime.',
    ],
    home: 'J’habite ici maintenant ! Viens voir ma cabane quand tu veux.',
  },
  'french-6e-letter-confusion': {
    greeting: 'Bienvenue dans ma mine ! Ici, les lettres se ressemblent, mais mon œil ne se trompe jamais. Pioche les bonnes, je te donne de la pierre.',
    lines: [
      'Un b, un d… regarde bien de quel côté est le ventre.',
      'Ma forge attend sa poutre. Tu as du bois ?',
      'Sous terre, on prend son temps. Moi aussi.',
    ],
    home: 'Ma forge ronfle à nouveau. Écoute : tac, tac, comme des syllabes.',
  },
  'french-6e-word-spelling': {
    greeting: 'Hé, bâtisseur ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt ?',
    lines: [
      'Un mot bien écrit, c’est un bloc qui ne s’effrite pas.',
      'Mon four ! Il me faut du sable et deux pierres.',
      'Le sable, ça vient des mots qu’on a beaucoup lus.',
      'Une pierre a plusieurs faces. Un mot a plusieurs sens : regarde la phrase autour.',
    ],
    home: 'Le four est chaud ! Tu sens ? Ça sent le pain et les mots bien cuits.',
  },
  'french-6e-grammar-spelling': {
    greeting: 'Meuh ! À la ferme, tout doit s’accorder. Trie bien les graines et je remplis tes sacs de terre.',
    lines: [
      'Meuh. Les vaches, au pluriel, prennent un s. Comme les murs.',
      'Mon étable, c’est de la terre et quatre poteaux de bois.',
      'Quand tout s’accorde, ça tient debout.',
      'Mon troupeau marche groupé, comme le déterminant, le nom et l’adjectif.',
    ],
    home: 'Meuh ! Mon étable est debout. Je dors au chaud, merci bâtisseur.',
  },
  'french-6e-reading': {
    greeting: 'Hou hou. Chaque paragraphe que tu lis construit un étage de ma tour. Prends ton temps, je ne compte pas les secondes à voix haute.',
    lines: ['Hou hou. La nuit, mon phare guide les lecteurs.', 'Du verre pour le phare : lis-moi une page.', 'Lire lentement, c’est lire quand même.'],
    home: 'Hou hou ! Mon phare est allumé. Regarde-le briller ce soir.',
  },
  'maths-6e-calculation': {
    greeting:
      'Bonjour, bâtisseur ! Dans ma plaine, on calcule avec les yeux : les points, la boîte de dix, la droite. Chaque calcul réussi, c’est de la brique pour le village.',
    lines: [
      'Compte mes points par cinq : deux rangées de cinq, ça fait dix.',
      'Un nombre et son complément font toujours dix. Comme mes deux ailes.',
      'Ma maison est en brique. Chaque calcul en pose une.',
      'Depuis mon brin d’herbe, je vois le port : un pont, un quai, un bateau. Tout ça se mesure.',
      'Le tour du quai, je l’ai fait à pied : tous les côtés, un par un, sans raccourci.',
    ],
    home: 'Mon nid de brique est fini ! Il a exactement dix fenêtres, comme mes points.',
  },
  'maths-6e-fractions': {
    greeting:
      'Coâ ! Bienvenue à la rivière. Ici, on coupe en parts égales et on regarde la figure avant de répondre. Chaque fraction lue, c’est un galet pour le village.',
    lines: [
      'Un nénuphar coupé en quatre : chaque part, c’est un quart.',
      'Plus il y a de parts, plus chaque part est petite. Même pour les moucherons.',
      'Ma hutte est en galets. Chaque fraction en apporte un.',
      'Je partage mes moucherons en parts égales. Le reste est toujours plus petit que le nombre de parts.',
    ],
    home: 'Ma hutte de galets est finie ! Une moitié pour dormir, une moitié pour chanter.',
  },
  'maths-6e-decimals': {
    greeting:
      'Salut, bâtisseur ! Sur mon volcan, la virgule sépare les unités des dixièmes. Regarde le tableau avant de répondre. Chaque nombre lu, c’est de l’obsidienne pour le village.',
    lines: [
      'La virgule, c’est la frontière : à gauche les unités, à droite les dixièmes.',
      'Le plus long n’est pas le plus grand ! 3,5 bat 3,45.',
      'Mon abri est en obsidienne, noire et brillante. Chaque nombre en apporte une.',
      'Un nombre géant, je le coupe en classes de trois chiffres, en partant de la droite.',
    ],
    home: 'Mon abri d’obsidienne est fini ! Il brille comme 1,0 : entier et sans un dixième qui manque.',
  },
  'maths-5e-signed-numbers': {
    greeting:
      'Salut, bâtisseur ! Ici, il fait moins dix. Les nombres négatifs, c’est à gauche de zéro sur la droite. Chaque calcul réussi, c’est de la glace pour le village.',
    lines: [
      'Moins cinq, c’est plus petit que moins deux. Plus on va à gauche, plus il fait froid.',
      'Soustraire, c’est ajouter l’opposé. Comme enlever un manteau.',
      'Mon igloo est en glace. Chaque calcul en taille un bloc.',
      'Un iceberg ne montre qu’une fraction de lui : le reste dort sous l’eau.',
    ],
    home: 'Mon igloo est fini ! Dedans il fait plus deux, dehors moins huit.',
  },
  'maths-5e-proportionality': {
    greeting:
      'Bienvenue au marché, bâtisseur ! Ici tout est proportionnel : deux fois plus de pommes, deux fois plus d’euros. Chaque compte juste, c’est de la toile pour le village.',
    lines: [
      'Trois pommes, six euros. Une pomme ? Passe par un seul, toujours.',
      'Cinquante pour cent, c’est la moitié. Même pour les raisins.',
      'Mon échoppe est en toile. Chaque compte juste en tend un morceau.',
      'Sur ma carte, un centimètre, c’est tout un bout de mer. J’ai vérifié… deux fois.',
    ],
    home: 'Mon échoppe est montée ! Cent pour cent finie, pas une remise.',
  },
  'french-5e-homophones': {
    greeting:
      'Salut, bâtisseur ! Au carrefour, deux mots se ressemblent mais ne mènent pas au même endroit. Remplace-les pour vérifier. Chaque bonne route, c’est un panneau pour le village.',
    lines: [
      'Ses, ces, c’est, s’est : quatre routes, un seul bon chemin.',
      'Remplace par « avait » : si ça marche, c’est « a » sans accent.',
      'Ma cabane est faite de panneaux. Chaque bonne réponse en cloue un.',
    ],
    home: 'Ma cabane est finie ! Tous ses panneaux montrent la bonne direction.',
  },
  'french-5e-conjugation': {
    greeting:
      'Coâ… non, ça c’est Nénu. Bienvenue au marais, bâtisseur ! Ici chaque rive est un temps : le passé, le présent, le futur. Chaque verbe juste, c’est de la tourbe pour le village.',
    lines: [
      'Hier je nageais, hier j’ai nagé : l’un dure, l’autre est fini.',
      'Demain je nagerai. Si j’avais des ailes, je volerais.',
      'Dans l’eau du marais, chaque verbe a son reflet : regarde sa terminaison, tu trouves son temps.',
      'Quand l’eau aura baissé, je passerai le gué.',
    ],
    home: 'Ma hutte de tourbe est finie ! Elle était en ruine, elle est debout, elle restera.',
  },
  'maths-4e-powers': {
    greeting:
      'Salut, bâtisseur ! À la forge, dix fois dix fois dix, ça s’écrit 10³. Regarde la règle avant de frapper. Chaque calcul juste, c’est de l’acier pour le village.',
    lines: [
      '10⁶ : un million. Un 1 et six zéros, comme mes six enclumes.',
      '2³, c’est 2 × 2 × 2 = 8. Pas 6 ! Le marteau compte trois coups.',
      'Mon atelier est en acier. Chaque calcul en forge une plaque.',
      'Moins fois moins, ça fait plus. Regarde la règle des signes avant de frapper.',
    ],
    home: 'Mon atelier d’acier est fini ! Solide comme 10 puissance 10.',
  },
  'maths-4e-algebra': {
    greeting:
      'Bip. Bonjour, bâtisseur ! Ici, x est un bloc dont on ne connaît pas encore la taille. On le range, on le développe, on le trouve. Chaque calcul juste, c’est un calque pour le village.',
    lines: [
      '3x + 5x = 8x. Trois blocs plus cinq blocs, huit blocs.',
      'Une équation, c’est une balance : même geste des deux côtés.',
      'Mon bureau est en calques. Chaque calcul en trace un.',
    ],
    home: 'Mon bureau de calques est fini ! Plan développé, réduit, résolu.',
  },
  'french-4e-agreement': {
    greeting:
      'Bêêê, bâtisseur ! Sur la falaise, chaque mot s’accroche à un autre : l’adjectif au nom, le verbe au sujet, le participe à qui de droit. Chaque accord juste, c’est une ardoise pour le village.',
    lines: [
      'Les filles sont parties : avec être, le participe suit le sujet.',
      'Qui est-ce qui grimpe ? Voilà le sujet, voilà l’accord.',
      'Ma bergerie est en ardoise. Chaque accord en pose une.',
      'Nous nous accrochons, vous vous accrochez : le pronom fait écho au sujet.',
    ],
    home: 'Ma bergerie d’ardoise est finie ! Elle est solide, elles sont solides, tout est accordé.',
  },
  'french-4e-vocabulary': {
    greeting:
      'Bonjour, bâtisseur ! Dans mon cabinet, chaque mot est un objet qu’on démonte : une racine, un préfixe, un suffixe. Chaque mot compris, c’est un parchemin pour le village.',
    lines: [
      'Télé-phone : la voix, de loin. Deux morceaux, un mot.',
      'Une pluie de cadeaux ne mouille pas : c’est le sens figuré.',
      'Mon nid est en parchemins. Chaque mot en roule un.',
      'Un petit mot qui se dit pareil ? Remplace-le par « pourtant » : si ça marche, tu écris « mais », avec un a et un i.',
    ],
    home: 'Mon nid de parchemins est fini ! Au sens propre : il tient. Au figuré : c’est un trésor.',
  },
  'maths-3e-geometry': {
    greeting:
      'Bonjour, bâtisseur ! Du belvédère, on voit tous les triangles. L’hypoténuse est toujours en face de l’angle droit : regarde la figure avant de calculer. Chaque longueur trouvée, c’est du marbre pour le village.',
    lines: [
      'Trois, quatre, cinq : le plus vieux triangle rectangle du monde.',
      'Deux droites parallèles, et les longueurs se multiplient par le même nombre.',
      'Mon kiosque est en marbre. Chaque calcul en taille une colonne.',
    ],
    home: 'Mon kiosque de marbre est fini ! Ses colonnes sont proportionnelles, Thalès serait content.',
  },
  'maths-3e-statistics': {
    greeting:
      'Hou ! Bienvenue à l’observatoire, bâtisseur. Ici, on résume une série en un seul nombre : la moyenne, la médiane. Et on prévoit avec les probabilités. Chaque calcul juste, c’est du quartz pour le village.',
    lines: [
      'La moyenne : tout additionner, puis partager équitablement.',
      'La médiane coupe la série rangée en deux moitiés.',
      'Mon dôme est en quartz. Chaque calcul en polit une facette.',
      'Dans mon carnet de relevés, chaque barre porte son effectif. Additionne-les tous : c’est l’effectif total.',
      'Trois parts pour moi, deux pour toi : compte d’abord toutes les parts, puis ce que vaut une part.',
    ],
    home: 'Mon dôme de quartz est fini ! En moyenne, un bloc par calcul ; en médiane, pareil.',
  },
  'maths-3e-functions': {
    greeting:
      'Bonjour, bâtisseur ! Une fonction, c’est une machine : on entre x, il sort f(x). Le tableau de valeurs te montre les deux. Chaque image trouvée, c’est un prisme pour le village.',
    lines: [
      'Entre x, sors f(x) : ma lumière fait pareil, elle transforme.',
      'Linéaire : la droite passe par l’origine. Affine : elle est décalée de b.',
      'Ma lanterne est en prismes. Chaque calcul en pose un.',
      'Mon faisceau part de x, touche la droite, puis éclaire f(x).',
    ],
    home: 'Ma lanterne de prismes est finie ! f(nuit) = lumière.',
  },
  'french-3e-close-reading': {
    greeting:
      'Bonsoir, bâtisseur ! De l’observatoire, on lit les textes comme le ciel : on cherche ce qui brille derrière les mots. Chaque indice trouvé, c’est une lentille pour le village.',
    lines: [
      'Un parapluie fermé et des cheveux mouillés : le texte n’a pas dit « pluie », et pourtant.',
      'Rapide comme l’éclair : le « comme » fait la comparaison.',
      'Ma lanterne est en lentilles. Chaque lecture en polit une.',
      'Il fait nuit sur l’observatoire. Qui fait nuit ? Ici, le « il » ne désigne personne.',
    ],
    home: 'Ma lanterne de lentilles est finie ! Elle grossit les mots pour mieux les lire.',
  },
  'english-6e-vocabulary': {
    greeting:
      'Hello, bâtisseur ! Dans la baie, on parle anglais. Écoute bien : le bouton Écouter lit chaque mot avec une voix anglaise. Chaque mot compris, c’est une cabine rouge pour le village.',
    lines: [
      'Thirteen ou thirty ? Écoute la fin : -teen, c’est de 13 à 19.',
      'Hello pour arriver, goodbye pour partir.',
      'Ma maison est une cabine rouge. Chaque bonne réponse en peint un carreau.',
    ],
    home: 'Ma cabine est finie ! On peut appeler jusqu’à Londres.',
  },
  'english-6e-grammar': {
    greeting:
      'Hello, bâtisseur ! Dans mon horloge, chaque verbe a sa place : am, is ou are, have ou has. Regarde d’abord le sujet, la règle est affichée. Chaque bon verbe, c’est un cadran pour le village.',
    lines: [
      'He, she, it : un seul, alors is, has, et un s au verbe.',
      'I am, you are, he is : tic, tac, toc.',
      'Ma maison est une horloge. Chaque bonne réponse en fait tourner une aiguille.',
    ],
    home: 'Mon horloge est finie ! Elle sonne à chaque verbe juste.',
  },
  'english-5e-vocabulary': {
    greeting:
      'Hello, bâtisseur ! Au Comptoir, on achète, on compte, on raconte sa journée, en anglais. Écoute bien chaque phrase : la voix anglaise la lit pour toi. Chaque bonne réponse, c’est une tuile pour le village.',
    lines: [
      'Chips, ce sont des frites ; crisps, ce sont des chips !',
      'How much is it? Ça veut dire : combien ça coûte ?',
      'Ma boutique a un toit de tuiles. Chaque bonne réponse en pose une.',
      'Ma boutique rouvre à 2 pm, donc à 14 h : pm, ça veut dire après midi !',
    ],
    home: 'Ma boutique est finie ! Open every day, même le dimanche.',
  },
  'english-5e-grammar': {
    greeting:
      'Hello, bâtisseur ! Au manoir, chaque pièce a son temps : ce qui se passe now, ce qui s’est passé yesterday. Cherche le petit mot qui dit quand. Chaque bonne réponse, c’est un lambris pour le village.',
    lines: [
      'Look! The cat is sleeping : en ce moment, be + -ing.',
      'Yesterday, I played : au passé, + ed.',
      'Mon salon est tout en lambris. Chaque bonne réponse en cire un.',
    ],
    home: 'Mon salon est fini ! Il est bien plus beau qu’avant : more beautiful than before.',
  },
  'english-4e-comprehension': {
    greeting:
      'Hello, bâtisseur ! Au théâtre, chaque question appelle une réplique : where, when, why… Écoute bien le premier mot. Chaque bonne réplique, c’est un velours pour le village.',
    lines: [
      'Where = où, when = quand, why = pourquoi : écoute le premier mot.',
      'Some pour dire oui, any pour la question et la négation.',
      'Ma loge est en velours rouge. Chaque bonne réplique en coud un pan.',
    ],
    home: 'Ma loge est finie ! The show must go on.',
  },
  'english-4e-grammar': {
    greeting:
      'Hello, bâtisseur ! À la gare, on parle de demain (will, going to), de ce qu’on doit faire (must, have to) et de ce qu’on a déjà fait (have been). Chaque bonne réponse, c’est un rail pour le village.',
    lines: [
      'Will pour prédire, going to pour un projet.',
      'Mustn’t, c’est interdit ; don’t have to, ce n’est pas obligé.',
      'Mon abri est au bout du quai. Chaque bonne réponse pose un rail.',
    ],
    home: 'Mon abri est fini ! The next train will arrive on time.',
  },
  'english-3e-comprehension': {
    greeting:
      'Hello, bâtisseur ! Au studio, on lit et on écoute des messages entiers : qui, quand, pourquoi ? Et attention aux faux amis : library n’est pas une librairie ! Chaque message compris, c’est une antenne pour le village.',
    lines: [
      'Actually, ça veut dire « en fait », pas « actuellement ».',
      'Because pour la cause, so pour la conséquence, but pour l’opposition.',
      'Ma régie est hérissée d’antennes. Chaque bonne réponse en dresse une.',
    ],
    home: 'Ma régie est finie ! On the air!',
  },
  'english-3e-grammar': {
    greeting:
      'Hello, bâtisseur ! Au château, les phrases sont longues : depuis quand (for, since), et si (if), et par qui (by). Pas de panique, la règle est affichée. Chaque bonne réponse, c’est une pierre de taille pour le village.',
    lines: [
      'For une durée, since un point de départ.',
      'If I were a dragon, I would fly : si j’étais un dragon, je volerais.',
      'Ma tour est en pierre de taille. Chaque bonne réponse en scelle une.',
    ],
    home: 'Ma tour est finie ! If I were you, I would climb to the top.',
  },
  'lv2-5e-introductions': {
    greeting:
      'Bonjour, bâtisseur ! Au Relais, les voyageurs se présentent, comptent et parlent de leur famille, dans ta deuxième langue. Écoute bien : la voix lit chaque mot pour toi. Chaque bonne réponse, c’est une dalle pour le village.',
    lines: [
      'Chaque année, je vole d’un pays à l’autre : les langues, ça me connaît.',
      'Dans ta deuxième langue, le nom a souvent un petit mot devant. Apprends-les ensemble, comme deux cubes collés.',
      'Un, deux, trois… Les nombres se posent comme des dalles : un par un, à voix haute.',
      'Mon nid est sur la cheminée de l’auberge. Chaque bonne réponse pose une dalle devant la porte.',
    ],
    home: 'Mon auberge est finie ! Les voyageurs peuvent entrer, d’où qu’ils viennent.',
  },
  'lv2-4e-daily-life': {
    greeting:
      'Salut, bâtisseur ! Au Jardin des heures, on dit l’heure, on raconte sa journée, on lit l’horaire et le menu, dans ta deuxième langue. Appuie sur Écouter : la voix lit chaque phrase pour toi. Chaque bonne réponse, c’est un bloc d’osier, le bois tressé des paniers, pour le village.',
    lines: [
      'Ma soupe mijote : ici, personne n’est pressé.',
      'Je range mes noisettes par moment de la journée : celles du matin, celles du soir.',
      'Mon panier d’osier se tresse brin par brin, comme une phrase : un mot après l’autre.',
      'Quand tu écoutes l’heure, cherche le petit mot près du nombre : il dit s’il faut ajouter ou enlever des minutes.',
    ],
    home: 'Ma cuisine est finie ! Il y a une place à table pour toi, à toute heure.',
  },
  'history-6e-antiquity': {
    greeting: 'Bonjour, bâtisseur ! Ici, on fouille le passé. Chaque bonne réponse te donne une mosaïque. Regarde la frise : le plus ancien est en haut.',
    lines: ['Une trouvaille ! Elle a sa place sur la frise.', 'Des mosaïques pour mon musée : réponds à une question.', 'Avant Jésus-Christ, on compte à l’envers. La frise t’aide.'],
    home: 'Mon musée est prêt. Chaque trouvaille a sa place.',
  },
  'geography-6e-living': {
    greeting: 'Bonjour, bâtisseur ! Ici, on regarde où vivent les humains : en ville, à la campagne, au bord de la mer. Chaque bonne réponse te donne du chaume. Le chaume, c’est de la paille séchée, serrée en bottes.',
    lines: ['Je regarde le paysage de loin avant de répondre : prends ton temps, toi aussi.', 'Du chaume pour mon quartier : lis un document.', 'Ville, champs, littoral : chaque paysage a ses habitants.'],
    home: 'Mon quartier est complet : la ville, les champs et la mer.',
  },
  'history-5e-middle-ages': {
    greeting: 'Bonjour, bâtisseur ! Ici, on écrit les chroniques du Moyen Âge. Chaque bonne réponse te donne un bloc d’enluminure. Une enluminure, c’est une page peinte à la main, avec des traits d’or.',
    lines: ['Une page à la fois, un siècle à la fois.', 'De l’enluminure pour mon logis : réponds à une question.', 'Un siècle, c’est cent ans. Le rappel te dit où il commence.'],
    home: 'Mon logis est fini. Mes pages enluminées ont leur place.',
  },
  'geography-5e-resources': {
    greeting: 'Bonjour, bâtisseur ! Au delta, on partage l’eau, l’énergie et la nourriture. Chaque bonne réponse te donne un bloc de rizière. Une rizière, c’est un champ plein d’eau où pousse le riz.',
    lines: ['Je marche dans l’eau du delta : elle nourrit les champs.', 'De la rizière pour mon moulin : lis un document.', 'Les nombres sont arrondis : on les compare, on ne calcule pas.'],
    home: 'Mon moulin est fini. L’eau du delta est partagée.',
  },
  'history-4e-revolutions': {
    greeting: 'Bonjour, bâtisseur ! À l’imprimerie, on imprime les nouvelles des révolutions. Chaque bonne réponse te donne un bloc de fonte. La fonte, c’est un métal lourd, coulé dans un moule.',
    lines: ['Une date, une nouvelle : je les range dans l’ordre.', 'De la fonte pour ma halle : réponds à une question.', 'Un document dit qui l’a écrit. Regarde la première ligne.'],
    home: 'Ma halle est finie. Les presses peuvent tourner.',
  },
  'geography-4e-globalization': {
    greeting: 'Bonjour, bâtisseur ! À l’escale, les bateaux arrivent du monde entier. Chaque bonne réponse te donne un conteneur. Un conteneur, c’est une grande boîte en métal qui voyage sur les bateaux.',
    lines: ['Je lève les conteneurs un par un, sans me presser.', 'Des conteneurs pour mon entrepôt : lis un document.', 'Port, canal, détroit : les mots du rappel t’aident.'],
    home: 'Mon entrepôt est fini. Le monde entier fait escale ici.',
  },
  'history-3e-twentieth-century': {
    greeting: 'Bonjour, bâtisseur. Ici, on garde la parole des témoins. Chaque bonne réponse te donne un bloc de reliure. Une reliure, c’est la couverture solide d’un livre.',
    lines: ['Chaque document a un auteur. Je regarde d’abord qui parle.', 'De la reliure pour ma bibliothèque : lis un témoignage.', 'On se souvient pour comprendre. Prends ton temps.'],
    home: 'Ma bibliothèque est prête. On peut venir lire et se souvenir, au calme.',
  },
  'geography-3e-france': {
    greeting: 'Bonjour, bâtisseur ! Sur le plateau, on regarde la France : ses villes, ses campagnes, ses routes. Chaque bonne réponse te donne un bloc de grès rose. Le grès, c’est une pierre faite de sable serré.',
    lines: ['J’arpente le plateau pas à pas : un jalon, puis un autre.', 'Du grès rose pour ma mairie : lis un document.', 'Ville, campagne, outre-mer : chaque territoire compte.'],
    home: 'Ma mairie est finie. Tout le plateau peut y venir.',
  },
  'life-earth-sciences-6e-living-world': {
    greeting: 'Bonjour, bâtisseur ! Ici, on regarde le vivant : les plantes, les bêtes et la Terre. Chaque bonne réponse te donne un fossile. Un fossile, c’est la trace d’un être vivant très ancien, gardée dans la pierre.',
    lines: ['Un escargot ne se presse jamais : toi non plus, prends ton temps.', 'Des fossiles pour ma serre : réponds à une question.', 'On classe un être vivant selon ce qu’il a, pas selon ce qu’il fait.'],
    home: 'Ma serre est prête. Les graines germent au chaud.',
  },
  'physics-chemistry-6e-matter-energy': {
    greeting: 'Bonjour, bâtisseur ! Ici, on fait des expériences : l’eau, les mouvements et les circuits. Chaque bonne réponse te donne un aimant. Un aimant attire le fer.',
    lines: ['Blop ! Regarde bien l’instrument avant de répondre.', 'Des aimants pour mon laboratoire : fais une expérience.', 'L’eau peut être solide, liquide ou gazeuse.'],
    home: 'Mon laboratoire est complet. Mes éprouvettes ont leur étagère.',
  },
  'technology-6e-objects': {
    greeting: 'Bonjour, bâtisseur ! Ici, on ouvre les objets pour voir comment ils marchent. Chaque bonne réponse te donne du carton. Le carton, c’est du papier épais : on le plie, on le découpe, on le recycle.',
    lines: ['Un objet a une fonction : à quoi sert-il ?', 'Du carton pour mon atelier : réponds à une question.', 'Chaque outil a sa place. Chaque mot du rappel aussi.'],
    home: 'Mon atelier est complet. Chaque outil a sa place.',
  },
  'civics-6e-democratic-society': {
    greeting: 'Bonjour, bâtisseur ! Au préau, on apprend à vivre ensemble. Chaque bonne réponse te donne de la craie. La craie, c’est pour écrire au tableau.',
    lines: ['Ici, chacun peut prendre la parole, à son tour.', 'De la craie pour mon préau : lis la règle, puis réponds.', 'Un délégué parle pour toute la classe.'],
    home: 'Mon préau est fini. Tout le monde peut s’y abriter.',
  },
  'life-earth-sciences-5e-active-planet': {
    greeting: 'Bonjour, bâtisseur ! Ici, on regarde la Terre : ses roches, son climat, ses ressources. Chaque bonne réponse te donne une strate. Une strate, c’est une couche de roche.',
    lines: ['Je laboure doucement, une couche après l’autre. Prends ton temps, toi aussi.', 'Des strates pour ma station : lis un document.', 'Le sol est vivant : regarde bien qui l’habite.'],
    home: 'Ma station est finie. Je note le temps qu’il fait, chaque jour.',
  },
  'physics-chemistry-5e-matter-universe': {
    greeting: 'Bonjour, bâtisseur ! À la saline, on mélange, on sépare, on pèse. Chaque bonne réponse te donne du sel. Le sel, c’est ce qui reste quand l’eau de mer s’en va.',
    lines: ['Coin-coin ! Regarde de près : un grain de sel, c’est un petit cube.', 'Du sel pour mon chalet : fais une expérience.', 'Avant de répondre, regarde bien l’unité.'],
    home: 'Mon chalet est fini. Mes bassins sont pleins de sel.',
  },
  'technology-5e-design': {
    greeting: 'Bonjour, bâtisseur ! À la menuiserie, on dessine un objet avant de le fabriquer. Chaque bonne réponse te donne du bambou. Le bambou, c’est une grande herbe très solide.',
    lines: ['Toc, toc ! Je mesure deux fois avant de couper.', 'Du bambou pour ma scierie : réponds à une question.', 'Un objet répond à un besoin. Cherche lequel.'],
    home: 'Ma scierie est finie. Mes plans sont punaisés au mur.',
  },
  'civics-5e-equality-solidarity': {
    greeting: 'Bonjour, bâtisseur ! Au fournil, on partage le pain avec tout le monde. Chaque bonne réponse te donne de la farine. La farine, c’est le blé moulu.',
    lines: ['Une miche, des parts égales : chacun a la sienne.', 'De la farine pour mon fournil : lis le document.', 'Aider les autres, c’est la solidarité.'],
    home: 'Mon fournil est fini. Il y a du pain pour chacun.',
  },
  'life-earth-sciences-4e-cells-evolution': {
    greeting: 'Bonjour, bâtisseur ! À la source, on regarde comment le vivant se transmet et change. Chaque bonne réponse te donne un pétale.',
    lines: ['Je butine fleur après fleur, sans me presser.', 'Des pétales pour ma pépinière : réponds à une question.', 'Un petit ressemble à ses parents, mais pas tout à fait.'],
    home: 'Ma pépinière est prête. Chaque graine a son rang.',
  },
  'physics-chemistry-4e-signals-circuits': {
    greeting: 'Bonjour, bâtisseur ! À la vigie, on guette les signaux : la lumière, le son, le courant. Chaque bonne réponse te donne une bobine. Une bobine, c’est du fil de cuivre enroulé.',
    lines: ['Je me tiens debout et je guette. Un signal à la fois.', 'Des bobines pour mon pavillon : réponds à une question.', 'Un circuit, c’est une boucle : suis-la jusqu’au bout.'],
    home: 'Mon pavillon est fini. Mon mât se voit de loin.',
  },
  'technology-4e-modeling': {
    greeting: 'Bonjour, bâtisseur ! Au bassin, on fait des maquettes pour comprendre les machines. Chaque bonne réponse te donne du liège. Le liège, c’est une écorce très légère : il flotte.',
    lines: ['Je tourne ma manivelle tout doucement : un tour à la fois.', 'Du liège pour mon usine : réponds à une question.', 'Un schéma se lit case par case, dans l’ordre.'],
    home: 'Mon usine est finie. Toutes mes maquettes tournent.',
  },
  'civics-4e-rights-freedoms': {
    greeting: 'Bonjour, bâtisseur ! Ici, la porte est ouverte, et je veille sur elle. Chaque bonne réponse te donne un pavé. Un pavé, c’est une pierre de la rue.',
    lines: ['Tu es libre, tant que tu respectes la liberté des autres.', 'Des pavés pour ma loge : relis le rappel.', 'Je veille, et la porte reste ouverte.'],
    home: 'Ma loge est finie. Chacun passe librement.',
  },
  'civics-3e-democratic-life': {
    greeting: 'Bonjour, bâtisseur ! Au forum, chacun donne son avis et écoute celui des autres. Chaque bonne réponse te donne de l’acajou. L’acajou, c’est un bois rouge et solide.',
    lines: ['Un débat, c’est écouter avant de répondre.', 'De l’acajou pour ma tribune : lis le document.', 'Une information se vérifie dans plusieurs sources.'],
    home: 'Ma tribune est finie. Chacun peut y parler, à son tour.',
  },
  'life-earth-sciences-3e-human-body': {
    greeting: 'Bonjour, bâtisseur ! Au verger, on prend soin du corps : bouger, dormir, bien manger. Chaque bonne réponse te donne du savon.',
    lines: ['Je mange doucement, et je fais des pauses. Toi aussi.', 'Du savon pour mon infirmerie : réponds à une question.', 'Le rappel a les mots qu’il faut : relis-le.'],
    home: 'Mon infirmerie est prête. Ici, on vient se reposer.',
  },
  'physics-chemistry-3e-motion-energy': {
    greeting: 'Salut, bâtisseur ! Au tremplin, on regarde ce qui fait bouger les choses : les forces et l’énergie. Chaque bonne réponse te donne un ressort.',
    lines: ['Je me roule en boule, et hop, je file ! Toi, prends ton temps.', 'Des ressorts pour mon gymnase : réponds à une question.', 'Une force, ça pousse ou ça tire. Regarde dans quel sens.'],
    home: 'Mon gymnase est fini. Le tremplin est ouvert à tous.',
  },
  'technology-3e-digital': {
    greeting: 'Bonjour, bâtisseur ! À la ruche, les messages voyagent d’un point à l’autre, comme dans un réseau. Chaque bonne réponse te donne de la cire. Les abeilles font leurs cases en cire.',
    lines: ['Je tisse mon fil d’un piquet à l’autre : chaque piquet a son adresse.', 'De la cire pour mon poste : réponds à une question.', 'Un programme se lit ligne par ligne, dans l’ordre.'],
    home: 'Mon poste est fini. Mes messages partent partout.',
  },
  'lv2-3e-travel': {
    greeting:
      'Bonjour, bâtisseur ! Au refuge, les voyageurs racontent leurs voyages dans ta deuxième langue. Appuie sur Écouter : la voix lit la question et l’histoire pour toi. Chaque bonne réponse te donne un bardeau. Les bardeaux, ce sont les petites planches de bois qui couvrent les murs du refuge.',
    lines: [
      'Les voyageurs écrivent leur voyage dans un carnet. Dans ma sacoche, je t’apporte leurs pages et les lettres des correspondants.',
      'Chaque lettre raconte un voyage : d’abord, ensuite, à la fin. Suis les petits mots, ils te guident.',
      'Écoute bien le verbe : il dit qui, et quand.',
      'Je range les lettres une par une dans mon casier, comme les bardeaux sur le mur : une rangée après l’autre.',
    ],
    home: 'Ma poste est finie ! Chaque lettre a sa place ici, et toi aussi.',
  },
  'lca-5e-legends': {
    greeting: 'Bonjour, bâtisseur ! Dans ma grotte, je garde les vieilles légendes. Chaque bonne réponse te donne du tuf. Le tuf, c’est une pierre tendre.',
    lines: ['Chaque légende a commencé par une histoire racontée.', 'Du tuf pour mon abri : lis la phrase et sa traduction.', 'Les mots d’hier vivent encore dans les nôtres.'],
    home: 'Mon abri est fini. Les légendes y sont à l’abri.',
  },
  'lca-4e-cities': {
    greeting: 'Bonjour, bâtisseur ! Je porte l’eau dans toute la cité. Chaque bonne réponse te donne une fresque. Une fresque, c’est une peinture sur un mur.',
    lines: ['Dans la cité, chacun a sa place : à la maison et sur la place.', 'Des fresques pour ma maison : lis le document.', 'La mer relie toutes les cités.'],
    home: 'Ma maison est finie. Et la fontaine coule pour tous.',
  },
  'lca-3e-ideas': {
    greeting: 'Bonjour, bâtisseur ! J’écris tout sur ma tablette de cire. Chaque bonne réponse te donne du laurier. Le laurier, c’est l’arbre des sages.',
    lines: ['Les Anciens nous ont laissé des mots et des idées.', 'Du laurier pour ma bibliothèque : lis le rappel.', 'Une racine grecque se cache dans beaucoup de nos mots.'],
    home: 'Ma bibliothèque est finie. Les idées y sont rangées.',
  },
};
