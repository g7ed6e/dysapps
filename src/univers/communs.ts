// Les textes communs aux deux univers d'aujourd'hui (étape J8 de U4, docs/conception/univers.md §5), déplacés sans un
// mot changé : les répliques des créatures (de src/blocland/biomes.ts) et le mot de chaque état d'île (de
// src/blocland/world/islandState.ts). Chaque univers les reprend dans ses textes ; il pourra les remplacer.
import type { BiomeId } from '../blocland/biomes';
import type { IslandStateId } from '../blocland/world/islandState';
import type { TextesCreature } from './types';

/** Le mot de chaque état d'île, sur la Carte et dans le panneau d'une île, toujours avec son icône. */
export const ETATS_D_ILE: Record<IslandStateId, string> = {
  fermee: 'Fermée',
  'a-explorer': 'À explorer',
  'en-chantier': 'En chantier',
  restauree: 'Restaurée',
};

/** Ce que disent les créatures, île par île. */
export const REPLIQUES: Record<BiomeId, TextesCreature> = {
  foret: {
    greeting: 'Salut, bâtisseur ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois pour le village.',
    lines: [
      'Tu entends ? Le vent coupe les mots en syllabes.',
      'Ma cabane a besoin de bois. Viens chasser les sons !',
      'Chaque arbre ici a poussé sur une rime.',
    ],
    home: 'J’habite ici maintenant ! Viens voir ma cabane quand tu veux.',
  },
  mine: {
    greeting: 'Bienvenue dans ma mine ! Ici, les lettres se ressemblent, mais mon œil ne se trompe jamais. Pioche les bonnes, je te donne de la pierre.',
    lines: [
      'Un b, un d… regarde bien de quel côté est le ventre.',
      'Ma forge attend sa poutre. Tu as du bois ?',
      'Sous terre, on prend son temps. Moi aussi.',
    ],
    home: 'Ma forge ronfle à nouveau. Écoute : tac, tac, comme des syllabes.',
  },
  carriere: {
    greeting: 'Hé, bâtisseur ! Dans ma carrière, chaque mot bien écrit devient du sable pour tes murs. Prêt ?',
    lines: [
      'Un mot bien écrit, c’est un bloc qui ne s’effrite pas.',
      'Mon four ! Il me faut du sable et deux pierres.',
      'Le sable, ça vient des mots qu’on a beaucoup lus.',
    ],
    home: 'Le four est chaud ! Tu sens ? Ça sent le pain et les mots bien cuits.',
  },
  ferme: {
    greeting: 'Meuh ! À la ferme, tout doit s’accorder. Trie bien les graines et je remplis tes sacs de terre.',
    lines: [
      'Meuh. Les vaches, au pluriel, prennent un s. Comme les murs.',
      'Mon étable, c’est de la terre et quatre poteaux de bois.',
      'Quand tout s’accorde, ça tient debout.',
    ],
    home: 'Meuh ! Mon étable est debout. Je dors au chaud, merci bâtisseur.',
  },
  tour: {
    greeting: 'Hou hou. Chaque paragraphe que tu lis construit un étage de ma tour. Prends ton temps, je ne compte pas les secondes à voix haute.',
    lines: ['Hou hou. La nuit, mon phare guide les lecteurs.', 'Du verre pour le phare : lis-moi une page.', 'Lire lentement, c’est lire quand même.'],
    home: 'Hou hou ! Mon phare est allumé. Regarde-le briller ce soir.',
  },
  plaine: {
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
  riviere: {
    greeting:
      'Coâ ! Bienvenue à la rivière. Ici, on coupe en parts égales et on regarde la figure avant de répondre. Chaque fraction lue, c’est un galet pour le village.',
    lines: [
      'Un nénuphar coupé en quatre : chaque part, c’est un quart.',
      'Plus il y a de parts, plus chaque part est petite. Même pour les moucherons.',
      'Ma hutte est en galets. Chaque fraction en apporte un.',
    ],
    home: 'Ma hutte de galets est finie ! Une moitié pour dormir, une moitié pour chanter.',
  },
  volcan: {
    greeting:
      'Salut, bâtisseur ! Sur mon volcan, la virgule sépare les unités des dixièmes. Regarde le tableau avant de répondre. Chaque nombre lu, c’est de l’obsidienne pour le village.',
    lines: [
      'La virgule, c’est la frontière : à gauche les unités, à droite les dixièmes.',
      'Le plus long n’est pas le plus grand ! 3,5 bat 3,45.',
      'Mon abri est en obsidienne, noire et brillante. Chaque nombre en apporte une.',
    ],
    home: 'Mon abri d’obsidienne est fini ! Il brille comme 1,0 : entier et sans un dixième qui manque.',
  },
  glacier: {
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
  marche: {
    greeting:
      'Bienvenue au marché, bâtisseur ! Ici tout est proportionnel : deux fois plus de pommes, deux fois plus d’euros. Chaque compte juste, c’est de la toile pour le village.',
    lines: [
      'Trois pommes, six euros. Une pomme ? Passe par un seul, toujours.',
      'Cinquante pour cent, c’est la moitié. Même pour les raisins.',
      'Mon échoppe est en toile. Chaque compte juste en tend un morceau.',
      'Deux navires, une cargaison : compte d’abord les parts, puis ce que vaut une part.',
      'Sur ma carte, un centimètre, c’est tout un bout de mer. J’ai vérifié… deux fois.',
    ],
    home: 'Mon échoppe est montée ! Cent pour cent finie, pas une remise.',
  },
  carrefour: {
    greeting:
      'Salut, bâtisseur ! Au carrefour, deux mots se ressemblent mais ne mènent pas au même endroit. Remplace-les pour vérifier. Chaque bonne route, c’est un panneau pour le village.',
    lines: [
      'Ses, ces, c’est, s’est : quatre routes, un seul bon chemin.',
      'Remplace par « avait » : si ça marche, c’est « a » sans accent.',
      'Ma cabane est faite de panneaux. Chaque bonne réponse en cloue un.',
    ],
    home: 'Ma cabane est finie ! Tous ses panneaux montrent la bonne direction.',
  },
  marais: {
    greeting:
      'Coâ… non, ça c’est Nénu. Bienvenue au marais, bâtisseur ! Ici chaque rive est un temps : le passé, le futur, et le subjonctif dans les roseaux. Chaque verbe juste, c’est de la tourbe pour le village.',
    lines: [
      'Hier je nageais, hier j’ai nagé : l’un dure, l’autre est fini.',
      'Demain je nagerai. Si j’avais des ailes, je volerais.',
      'Il faut que tu viennes voir ma hutte de tourbe.',
    ],
    home: 'Ma hutte de tourbe est finie ! Elle était en ruine, elle est debout, elle restera.',
  },
  forge: {
    greeting:
      'Salut, bâtisseur ! À la forge, dix fois dix fois dix, ça s’écrit 10³. Regarde la règle avant de frapper. Chaque calcul juste, c’est de l’acier pour le village.',
    lines: [
      '10⁶ : un million. Un 1 et six zéros, comme mes six enclumes.',
      '2³, c’est 2 × 2 × 2 = 8. Pas 6 ! Le marteau compte trois coups.',
      'Mon atelier est en acier. Chaque calcul en forge une plaque.',
    ],
    home: 'Mon atelier d’acier est fini ! Solide comme 10 puissance 10.',
  },
  atelier: {
    greeting:
      'Bip. Bonjour, bâtisseur ! Ici, x est un bloc dont on ne connaît pas encore la taille. On le range, on le développe, on le trouve. Chaque calcul juste, c’est un calque pour le village.',
    lines: [
      '3x + 5x = 8x. Trois blocs plus cinq blocs, huit blocs.',
      'Une équation, c’est une balance : même geste des deux côtés.',
      'Mon bureau est en calques. Chaque calcul en trace un.',
    ],
    home: 'Mon bureau de calques est fini ! Plan développé, réduit, résolu.',
  },
  falaise: {
    greeting:
      'Bêêê, bâtisseur ! Sur la falaise, chaque mot s’accroche à un autre : l’adjectif au nom, le verbe au sujet, le participe à qui de droit. Chaque accord juste, c’est une ardoise pour le village.',
    lines: [
      'Les filles sont parties : avec être, le participe suit le sujet.',
      'Qui est-ce qui grimpe ? Voilà le sujet, voilà l’accord.',
      'Ma bergerie est en ardoise. Chaque accord en pose une.',
    ],
    home: 'Ma bergerie d’ardoise est finie ! Elle est solide, elles sont solides, tout est accordé.',
  },
  cabinet: {
    greeting:
      'Bonjour, bâtisseur ! Dans mon cabinet, chaque mot est un objet qu’on démonte : une racine, un préfixe, un suffixe. Chaque mot compris, c’est un parchemin pour le village.',
    lines: [
      'Télé-phone : la voix, de loin. Deux morceaux, un mot.',
      'Une pluie de cadeaux ne mouille pas : c’est le sens figuré.',
      'Mon nid est en parchemins. Chaque mot en roule un.',
    ],
    home: 'Mon nid de parchemins est fini ! Au sens propre : il tient. Au figuré : c’est un trésor.',
  },
  belvedere: {
    greeting:
      'Bonjour, bâtisseur ! Du belvédère, on voit tous les triangles. L’hypoténuse est toujours en face de l’angle droit : regarde la figure avant de calculer. Chaque longueur trouvée, c’est du marbre pour le village.',
    lines: [
      'Trois, quatre, cinq : le plus vieux triangle rectangle du monde.',
      'Deux droites parallèles, et les longueurs se multiplient par le même nombre.',
      'Mon kiosque est en marbre. Chaque calcul en taille une colonne.',
    ],
    home: 'Mon kiosque de marbre est fini ! Ses colonnes sont proportionnelles, Thalès serait content.',
  },
  donnees: {
    greeting:
      'Hou ! Bienvenue à l’observatoire, bâtisseur. Ici, on résume une série en un seul nombre : la moyenne, la médiane. Et on prévoit avec les probabilités. Chaque calcul juste, c’est du quartz pour le village.',
    lines: [
      'La moyenne : tout additionner, puis partager équitablement.',
      'La médiane coupe la série rangée en deux moitiés.',
      'Mon dôme est en quartz. Chaque calcul en polit une facette.',
      'Dans mon carnet de relevés, chaque barre porte son effectif. Additionne-les tous : c’est l’effectif total.',
    ],
    home: 'Mon dôme de quartz est fini ! En moyenne, un bloc par calcul ; en médiane, pareil.',
  },
  phare: {
    greeting:
      'Bonjour, bâtisseur ! Une fonction, c’est une machine : on entre x, il sort f(x). Le tableau de valeurs te montre les deux. Chaque image trouvée, c’est un prisme pour le village.',
    lines: [
      'Entre x, sors f(x) : ma lumière fait pareil, elle transforme.',
      'Linéaire : la droite passe par l’origine. Affine : elle est décalée de b.',
      'Ma lanterne est en prismes. Chaque calcul en pose un.',
    ],
    home: 'Ma lanterne de prismes est finie ! f(nuit) = lumière.',
  },
  textes: {
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
  baie: {
    greeting:
      'Hello, bâtisseur ! Dans la baie, on parle anglais. Écoute bien : le bouton Écouter lit chaque mot avec une voix anglaise. Chaque mot compris, c’est une cabine rouge pour le village.',
    lines: [
      'Thirteen ou thirty ? Écoute la fin : -teen, c’est de 13 à 19.',
      'Hello pour arriver, goodbye pour partir.',
      'Ma maison est une cabine rouge. Chaque bonne réponse en peint un carreau.',
    ],
    home: 'Ma cabine est finie ! On peut appeler jusqu’à Londres.',
  },
  horloge: {
    greeting:
      'Hello, bâtisseur ! Dans mon horloge, chaque verbe a sa place : am, is ou are, have ou has. Regarde d’abord le sujet, la règle est affichée. Chaque bon verbe, c’est un cadran pour le village.',
    lines: [
      'He, she, it : un seul, alors is, has, et un s au verbe.',
      'I am, you are, he is : tic, tac, toc.',
      'Ma maison est une horloge. Chaque bonne réponse en fait tourner une aiguille.',
    ],
    home: 'Mon horloge est finie ! Elle sonne à chaque verbe juste.',
  },
  comptoir: {
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
  manoir: {
    greeting:
      'Hello, bâtisseur ! Au manoir, chaque pièce a son temps : ce qui se passe now, ce qui s’est passé yesterday. Cherche le petit mot qui dit quand. Chaque bonne réponse, c’est un lambris pour le village.',
    lines: [
      'Look! The cat is sleeping : en ce moment, be + -ing.',
      'Yesterday, I played : au passé, + ed.',
      'Mon salon est tout en lambris. Chaque bonne réponse en cire un.',
    ],
    home: 'Mon salon est fini ! Il est bien plus beau qu’avant : more beautiful than before.',
  },
  theatre: {
    greeting:
      'Hello, bâtisseur ! Au théâtre, chaque question appelle une réplique : where, when, why… Écoute bien le premier mot. Chaque bonne réplique, c’est un velours pour le village.',
    lines: [
      'Where = où, when = quand, why = pourquoi : écoute le premier mot.',
      'Some pour dire oui, any pour la question et la négation.',
      'Ma loge est en velours rouge. Chaque bonne réplique en coud un pan.',
    ],
    home: 'Ma loge est finie ! The show must go on.',
  },
  gare: {
    greeting:
      'Hello, bâtisseur ! À la gare, on parle de demain (will, going to), de ce qu’on doit faire (must, have to) et de ce qu’on a déjà fait (have been). Chaque bonne réponse, c’est un rail pour le village.',
    lines: [
      'Will pour prédire, going to pour un projet.',
      'Mustn’t, c’est interdit ; don’t have to, ce n’est pas obligé.',
      'Mon abri est au bout du quai. Chaque bonne réponse pose un rail.',
    ],
    home: 'Mon abri est fini ! The next train will arrive on time.',
  },
  studio: {
    greeting:
      'Hello, bâtisseur ! Au studio, on lit et on écoute des messages entiers : qui, quand, pourquoi ? Et attention aux faux amis : library n’est pas une librairie ! Chaque message compris, c’est une antenne pour le village.',
    lines: [
      'Actually, ça veut dire « en fait », pas « actuellement ».',
      'Because pour la cause, so pour la conséquence, but pour l’opposition.',
      'Ma régie est hérissée d’antennes. Chaque bonne réponse en dresse une.',
    ],
    home: 'Ma régie est finie ! On the air!',
  },
  chateau: {
    greeting:
      'Hello, bâtisseur ! Au château, les phrases sont longues : depuis quand (for, since), et si (if), et par qui (by). Pas de panique, la règle est affichée. Chaque bonne réponse, c’est une pierre de taille pour le village.',
    lines: [
      'For une durée, since un point de départ.',
      'If I were a dragon, I would fly : si j’étais un dragon, je volerais.',
      'Ma tour est en pierre de taille. Chaque bonne réponse en scelle une.',
    ],
    home: 'Ma tour est finie ! If I were you, I would climb to the top.',
  },
  relais: {
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
  jardin: {
    greeting:
      'Salut, bâtisseur ! Au Jardin des heures, on dit l’heure, on raconte sa journée et on lit le menu, dans ta deuxième langue. La voix lit chaque mot pour toi. Chaque bonne réponse, c’est un bloc d’osier pour le village.',
    lines: [
      'Ma soupe mijote : ici, personne n’est pressé.',
      'Je range mes noisettes par moment de la journée : celles du matin, celles du soir.',
      'Mon panier d’osier se tresse brin par brin, comme une phrase : un mot après l’autre.',
    ],
    home: 'Ma cuisine est finie ! Il y a une place à table pour toi, à toute heure.',
  },
};
