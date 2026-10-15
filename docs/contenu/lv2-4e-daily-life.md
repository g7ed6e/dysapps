---
lieu : lv2-4e-daily-life
module : La journée, l’heure, les repas
matière : lv2
classe : 4e
description : Dire l’heure, raconter sa journée, lire un horaire ou un menu : une journée au jardin, dans ta deuxième langue.
gardien : le Soleil de cuivre
icône : languages
créature : Muscade
---

# Jardin des heures

> Île de la LV2 (allemand ou espagnol), à partir de la 5e : une seule île par archipel, la même pour les deux langues, en bout de chemin (rien n’en dépend). Seules changent les missions, choisies par la LV2 des Réglages, et la voix.
> Les missions de chaque langue sont dans le même ordre : la borne de même rang ouvre la mission de la LV2 choisie.

## ¿Qué hora es? · `es-time`

- description : L’heure entendue : y cuarto, menos cuarto ; puis où est-on, qui parle ?
- compétences : c4.es.ecouter.intervention-breve · c4.es.dialoguer.echanges-sociaux · c4.es.langue.lexique
- lv2 : es
- langue : es
- bravo : Bien compris !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- langue des choix : fr

### Niveau 1 · `lv2-4e-daily-life-es-time-1`

- consigne : Appuie sur Écouter pour entendre l’heure en espagnol, puis choisis la bonne heure. La règle est affichée.

Pour tous les items :
- aide « La hora » :
  - ¿Qué hora es? = Quelle heure est-il ?
  - Es la una (1 h) ; son las dos (2 h), son las cuatro (4 h).
  - y cuarto = et quart ; y media = et demie
  - menos cuarto, comme en français : las cuatro menos cuarto = 3 h 45
  - y cinco = et cinq ; menos veinte = moins vingt
  - de la mañana = du matin ; de la tarde = de l’après-midi, du soir
  - en punto = pile

1. énoncé : Son las tres y cuarto.
   - lu : Son las tres y cuarto.
   - choix : 2 h 45 · 3 h 15 · 3 h 45
   - réponse : 3 h 15
   - indice : Comme en français : y cuarto, et quart ; menos cuarto, moins le quart.
   - explication : Son las tres y cuarto = 3 h 15 : tres (3), y cuarto (et quart). 2 h 45 se dirait las tres menos cuarto.
2. énoncé : Son las ocho y media.
   - lu : Son las ocho y media.
   - choix : 8 h 15 · 8 h 30 · 8 h 45
   - réponse : 8 h 30
   - indice : media, c’est la moitié d’une heure.
   - explication : y media = et demie : son las ocho y media = 8 h 30. y cuarto serait 8 h 15.
3. énoncé : Son las diez menos cuarto.
   - lu : Son las diez menos cuarto.
   - choix : 9 h 15 · 9 h 45 · 10 h 15
   - réponse : 9 h 45
   - indice : menos, c’est moins : on retire un quart d’heure à 10 h.
   - explication : Comme en français : las diez menos cuarto = 10 h moins le quart = 9 h 45. 10 h 15 se dirait las diez y cuarto ; 9 h 15, las nueve y cuarto.
4. énoncé : Es la una y diez.
   - lu : Es la una y diez.
   - choix : 1 h 10 · 10 h 00 · 12 h 50
   - réponse : 1 h 10
   - indice : la una, c’est l’heure. y diez, ce sont les minutes.
   - explication : Es la una y diez = 1 h 10 : la una (1 h), y diez (et dix minutes). 12 h 50 se dirait la una menos diez.
5. énoncé : Son las cinco menos diez.
   - lu : Son las cinco menos diez.
   - choix : 4 h 50 · 5 h 10 · 5 h 50
   - réponse : 4 h 50
   - indice : menos : on retire 10 minutes à 5 h.
   - explication : las cinco menos diez = 5 h moins dix = 4 h 50. 5 h 10 se dirait las cinco y diez ; 5 h 50, las seis menos diez.
6. énoncé : Son las doce en punto.
   - lu : Son las doce en punto.
   - choix : 2 h 00 · 11 h 00 · 12 h 00
   - réponse : 12 h 00
   - indice : doce ou dos ? Et en punto, c’est pile.
   - explication : Son las doce en punto = 12 h pile : doce = 12, dos = 2, once = 11. en punto veut dire pile.
7. énoncé : Son las siete de la tarde.
   - lu : Son las siete de la tarde.
   - choix : 7 h 00 · 17 h 00 · 19 h 00
   - réponse : 19 h 00
   - indice : de la tarde : l’après-midi ou le soir. Et siete, c’est 7.
   - explication : las siete de la tarde = 7 h du soir = 19 h. 7 h se dirait las siete de la mañana ; 17 h, las cinco de la tarde.
8. énoncé : Son las nueve de la mañana.
   - lu : Son las nueve de la mañana.
   - choix : 9 h 00 · 19 h 00 · 21 h 00
   - réponse : 9 h 00
   - indice : de la mañana : le matin.
   - explication : las nueve de la mañana = 9 h du matin. 21 h, ce serait le soir, pas la mañana.

### Niveau 2 · `lv2-4e-daily-life-es-time-2`

- consigne : Cette fois, une scène de la journée : lis la question, puis appuie sur Écouter pour entendre la phrase en espagnol. Le lexique est affiché.
- programme : c4.es.ecouter.indices

Pour tous les items :
- aide « ¿Quién habla? ¿Dónde estamos? » :
  - la mesa = la table ; la entrada = le billet
  - el tren sale = le train part ; el andén = le quai
  - abrid = ouvrez (à toute la classe) ; la cama = le lit
  - buenas noches = bonne nuit ; cenar = dîner
  - la cebolla = l’oignon ; la sartén = la poêle

1. énoncé : Buenas tardes. ¿Una mesa para dos?
   - question : Où est-on ?
   - lu : Buenas tardes. Una mesa para dos?
   - choix : Au restaurant · À la gare · Au collège
   - réponse : Au restaurant
   - indice : Cherche le mot mesa dans le lexique.
   - explication : una mesa para dos = une table pour deux : on est au restaurant.
2. énoncé : Silencio, por favor. Abrid el cuaderno.
   - question : Qui parle ?
   - lu : Silencio, por favor. Abrid el cuaderno.
   - choix : Un professeur · Un serveur · Un vendeur
   - réponse : Un professeur
   - indice : Regarde le lexique : abrid.
   - explication : Silencio, por favor = du silence, s’il vous plaît ; abrid el cuaderno = ouvrez le cahier. C’est un professeur qui parle à sa classe.
3. énoncé : El tren para Sevilla sale del andén dos.
   - question : Où est-on ?
   - lu : El tren para Sevilla sale del andén dos.
   - choix : À la gare · À l’arrêt de bus · À la piscine
   - réponse : À la gare
   - indice : Regarde le lexique : el tren, el andén.
   - explication : el tren sale del andén dos = le train part du quai 2 : on est à la gare.
4. énoncé : Son cuatro euros con cincuenta, por favor.
   - question : Qui parle ?
   - lu : Son cuatro euros con cincuenta, por favor.
   - choix : Un vendeur · Un professeur · Un élève
   - réponse : Un vendeur
   - indice : Qui dit un prix ?
   - explication : cuatro euros con cincuenta = 4 euros 50 : c’est un prix, donc un vendeur.
5. énoncé : ¡Buenas noches! Me voy a la cama.
   - question : À quel moment de la journée est-on ?
   - lu : Buenas noches! Me voy a la cama.
   - choix : Le soir · Le matin · À midi
   - réponse : Le soir
   - indice : Regarde le lexique : buenas noches.
   - explication : buenas noches = bonne nuit ; me voy a la cama = je vais au lit. C’est le soir.
6. énoncé : Dos entradas para la película de las ocho.
   - question : Où est-on ?
   - lu : Dos entradas para la película de las ocho.
   - choix : Au cinéma · Au restaurant · À la gare
   - réponse : Au cinéma
   - indice : la película, c’est le film.
   - explication : dos entradas = deux billets ; la película de las ocho = le film de 20 h. On est au cinéma.
7. énoncé : Mamá, ¿qué hay para cenar?
   - question : Qui parle ?
   - lu : Mamá, qué hay para cenar?
   - choix : Un enfant à sa mère · Un serveur à un client · Un professeur à un élève
   - réponse : Un enfant à sa mère
   - indice : Écoute le premier mot de la phrase.
   - explication : Mamá = maman ; ¿qué hay para cenar? = qu’est-ce qu’il y a pour le dîner ? C’est un enfant qui parle à sa mère.
8. énoncé : Primero, corta la cebolla. Luego, a la sartén.
   - question : Où est-on ?
   - lu : Primero, corta la cebolla. Luego, a la sartén.
   - choix : Dans une cuisine · Dans une classe · Dans un magasin
   - réponse : Dans une cuisine
   - indice : Cherche la cebolla et la sartén dans le lexique.
   - explication : corta la cebolla = coupe l’oignon ; a la sartén = dans la poêle. On prépare un plat : on est dans une cuisine.

## Mi día · `es-my-day`

- description : La journée : me levanto, se ducha ; puis e devient ie, o devient ue.
- compétences : c4.es.langue.temps-verbaux · c4.es.langue.groupe-nominal · c4.es.langue.lexique
- lv2 : es
- langue : es
- consigne : Lis ou écoute la question en espagnol, puis choisis la bonne réponse. La règle est affichée.
- bravo : Bien répondu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-es-my-day-1`

Pour tous les items :
- aide « Mi día : les verbes avec se » :
  - levantarse = se lever ; ducharse = se doucher ; peinarse = se coiffer
  - lavarse los dientes = se brosser les dents
  - llamarse : me llamo, te llamas, se llama, nos llamamos
  - Conjugué, le petit mot passe devant le verbe : me, te, se, nos.
  - Pour parler de quelqu’un d’autre : se.
  - desayunar = prendre le petit-déjeuner
  - comer = déjeuner ; cenar = dîner. Ces trois verbes n’ont pas de se.

1. énoncé : ¿A qué hora te levantas?
   - lu : A qué hora te levantas?
   - choix : Me levanto a las siete. · Te levantas a las siete. · Levanto a las siete.
   - réponse : Me levanto a las siete.
   - indice : On te demande à toi : tu réponds pour toi, avec me.
   - explication : On te pose la question : tu réponds pour toi, avec me. Me levanto a las siete. te levantas veut dire « tu te lèves » ; sans me, la phrase ne va pas.
2. énoncé : ¿Tu hermano se ducha por la mañana?
   - lu : Tu hermano se ducha por la mañana?
   - choix : Sí, se ducha. · Sí, se duchas. · Sí, ducha.
   - réponse : Sí, se ducha.
   - indice : On parle de ton frère : se, et le verbe avec él.
   - explication : On parle de ton frère : tu réponds avec se et le verbe de él. Sí, se ducha. se duchas mélange se et tú.
3. énoncé : ¿Te peinas antes de salir?
   - lu : Te peinas antes de salir?
   - choix : Sí, me peino. · Sí, se peino. · Sí, peino.
   - réponse : Sí, me peino.
   - indice : Tu réponds pour toi : quel petit mot va avec yo ?
   - explication : On te pose la question : tu réponds pour toi, avec me. Sí, me peino (je me coiffe). se va avec él ou ella.
4. énoncé : ¿A qué hora se levantan tus padres?
   - lu : A qué hora se levantan tus padres?
   - choix : Se levantan a las seis. · Se levanta a las seis. · Nos levantamos a las seis.
   - réponse : Se levantan a las seis.
   - indice : tus padres : ils sont deux.
   - explication : On parle de tes parents (ellos) : se levantan, avec -n. se levanta, c’est pour une seule personne ; nos levantamos, pour nous.
5. énoncé : ¿Lucía se lava los dientes?
   - lu : Lucía se lava los dientes?
   - choix : Sí, se lava los dientes. · Sí, te lavas los dientes. · Sí, me lavo los dientes.
   - réponse : Sí, se lava los dientes.
   - indice : On parle de Lucía, pas de toi.
   - explication : On parle de Lucía (ella) : tu réponds avec se. Se lava los dientes, elle se brosse les dents. me lavo, c’est pour toi.
6. énoncé : ¿A qué hora cenas?
   - lu : A qué hora cenas?
   - choix : Ceno a las nueve. · Me ceno a las nueve. · Desayuno a las nueve.
   - réponse : Ceno a las nueve.
   - indice : cenar = dîner. A-t-il un se ?
   - explication : On te pose la question : tu réponds pour toi. cenar n’a pas de se : ceno a las nueve. En Espagne, on dîne souvent tard.
7. énoncé : ¿Cuándo te duchas?
   - lu : Cuándo te duchas?
   - choix : Me ducho por la mañana. · Te duchas por la mañana. · Ducho por la mañana.
   - réponse : Me ducho por la mañana.
   - indice : Tu réponds pour toi, avec me.
   - explication : On te pose la question : tu réponds pour toi, avec me. Me ducho por la mañana. te duchas veut dire « tu te douches ».
8. énoncé : ¿Dónde comes a mediodía?
   - lu : Dónde comes a mediodía?
   - choix : Como en el comedor. · Me como en el comedor. · Ceno en el comedor.
   - réponse : Como en el comedor.
   - indice : comer = déjeuner. A-t-il un se ?
   - explication : On te pose la question : tu réponds pour toi. comer n’a pas de se : como en el comedor, je déjeune à la cantine.

### Niveau 2 · `lv2-4e-daily-life-es-my-day-2`

Pour tous les items :
- aide « Les verbes qui changent » :
  - e devient ie : empezar (commencer) : empiezo, empiezas, empieza
  - o devient ue : volver (rentrer) : vuelvo, vuelves, vuelve
  - u devient ue : un seul verbe, jugar (jouer).
  - Avec nosotros et vosotros, rien ne change : volvemos, volvéis.
  - despertarse = se réveiller ; acostarse = se coucher
  - merendar = goûter ; preferir = préférer ; encontrar = trouver

1. énoncé : ¿A qué hora te despiertas?
   - lu : A qué hora te despiertas?
   - choix : Me despierto a las siete. · Me desperto a las siete. · Te despiertas a las siete.
   - réponse : Me despierto a las siete.
   - indice : despertarse : e devient ie avec yo. Et tu réponds pour toi.
   - explication : On te pose la question : tu réponds pour toi. despertarse : e devient ie, me despierto. desperto n’existe pas.
2. énoncé : ¿A qué hora te acuestas?
   - lu : A qué hora te acuestas?
   - choix : Me acuesto a las diez. · Me acosto a las diez. · Te acuestas a las diez.
   - réponse : Me acuesto a las diez.
   - indice : acostarse : o devient ue avec yo.
   - explication : On te pose la question : tu réponds pour toi. acostarse : o devient ue, me acuesto. acosto n’existe pas.
3. énoncé : ¿Encuentras tu mochila?
   - lu : Encuentras tu mochila?
   - choix : No, no la encuentro. · No, no la encontro. · No, no la encuentras.
   - réponse : No, no la encuentro.
   - indice : encontrar : o devient ue avec yo.
   - explication : On te pose la question : tu réponds pour toi. encontrar : o devient ue, no la encuentro. encontro n’existe pas.
4. énoncé : ¿Meriendas después del colegio?
   - lu : Meriendas después del colegio?
   - choix : Sí, meriendo pan con chocolate. · Sí, merendo pan con chocolate. · Sí, meriendas pan con chocolate.
   - réponse : Sí, meriendo pan con chocolate.
   - indice : merendar : e devient ie avec yo.
   - explication : On te pose la question : tu réponds pour toi. merendar : e devient ie, meriendo. En Espagne, on goûte souvent vers 18 h.
5. énoncé : ¿Cuántas horas duermes?
   - lu : Cuántas horas duermes?
   - choix : Duermo nueve horas. · Dormo nueve horas. · Duermes nueve horas.
   - réponse : Duermo nueve horas.
   - indice : dormir : o devient ue avec yo.
   - explication : On te pose la question : tu réponds pour toi. dormir : o devient ue, duermo nueve horas. dormo n’existe pas.
6. énoncé : ¿Prefieres la leche o el zumo?
   - lu : Prefieres la leche o el zumo?
   - choix : Prefiero el zumo. · Prefero el zumo. · Prefieres el zumo.
   - réponse : Prefiero el zumo.
   - indice : preferir : le deuxième e devient ie avec yo.
   - explication : On te pose la question : tu réponds pour toi. preferir : e devient ie, prefiero. prefero n’existe pas.
7. énoncé : ¿A qué juegas en el recreo?
   - lu : A qué juegas en el recreo?
   - choix : Juego al fútbol. · Jugo al fútbol. · Juegas al fútbol.
   - réponse : Juego al fútbol.
   - indice : jugar est le seul verbe où u devient ue.
   - explication : On te pose la question : tu réponds pour toi. jugar : u devient ue, juego al fútbol. jugo veut dire « le jus ».
8. énoncé : ¿A qué hora os despertáis los domingos?
   - lu : A qué hora os despertáis los domingos?
   - choix : Nos despertamos a las diez. · Nos despiertamos a las diez. · Os despertáis a las diez.
   - réponse : Nos despertamos a las diez.
   - indice : On te demande pour vous tous : réponds avec nos. Avec nosotros, le e ne change pas.
   - explication : On vous pose la question, à toi et aux autres : tu réponds avec nos. Avec nosotros, rien ne change : nos despertamos.

## Horarios y menús · `es-timetable`

- description : Un emploi du temps, un menu, un programme de loisirs : la bonne ligne.
- compétences : c4.es.lire.informations · c4.es.culture.ecole-societe · c4.es.langue.lexique
- lv2 : es
- langue : es
- bravo : Bien lu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- langue des choix : fr

### Niveau 1 · `lv2-4e-daily-life-es-timetable-1`

- consigne : Lis la question, puis trouve la bonne ligne du document en espagnol. Le lexique est affiché.

Pour tous les items :
- aide « Leer un horario » :
  - lunes, martes, miércoles = lundi, mardi, mercredi
  - jueves, viernes, sábado, domingo = jeudi, vendredi, samedi, dimanche
  - Lengua = l’espagnol ; Educación Física = le sport
  - el recreo = la récréation ; la salida = la sortie
  - sale = part ; llega = arrive ; cerrado = fermé
  - 7:15 = 7 h 15 ; 16:45 = 16 h 45

1. énoncé : "Lunes\n9:00 Matemáticas\n10:00 Lengua\n11:00 Recreo\n11:30 Inglés"
   - question : Le lundi, quel cours as-tu à 9 h ?
   - lu : Lunes. A las nueve, matemáticas. A las diez, lengua. A las once, recreo. A las once y treinta, inglés.
   - choix : Maths · Espagnol · Anglais
   - réponse : Maths
   - indice : Trouve la ligne qui commence par 9 h, puis lis la matière.
   - explication : 9:00 Matemáticas : à 9 h, tu as maths. Lengua (l’espagnol) est à 10 h, Inglés (l’anglais) à 11 h 30.
2. énoncé : "Martes\n8:30 Geografía\n9:25 Recreo\n9:45 Ciencias\n10:40 Música"
   - question : Le mardi, à quelle heure est la récréation ?
   - lu : Martes. A las ocho y treinta, geografía. A las nueve y veinticinco, recreo. A las nueve y cuarenta y cinco, ciencias. A las diez y cuarenta, música.
   - choix : 9 h 25 · 9 h 45 · 10 h 40
   - réponse : 9 h 25
   - indice : Cherche le mot Recreo, puis lis l’heure de sa ligne.
   - explication : el recreo = la récréation : sa ligne dit 9:25, donc 9 h 25. À 9 h 45, c’est Ciencias.
3. énoncé : "Mi horario\nMatemáticas: lunes y jueves\nEducación Física: martes y viernes\nMúsica: miércoles"
   - question : Quels jours as-tu sport ?
   - lu : Mi horario. Matemáticas, lunes y jueves. Educación Física, martes y viernes. Música, miércoles.
   - choix : Le mardi et le vendredi · Le mercredi et le vendredi · Le lundi et le jeudi
   - réponse : Le mardi et le vendredi
   - indice : Le sport, c’est Educación Física. Attention : martes ou miércoles ?
   - explication : Educación Física (le sport) : martes y viernes, le mardi et le vendredi. martes = mardi ; miércoles = mercredi.
4. énoncé : "Autobús 5: al instituto\nsale de la plaza: 7:50\nllega al instituto: 8:20"
   - question : À quelle heure le bus arrive-t-il au collège ?
   - lu : Autobús cinco, al instituto. Sale de la plaza a las siete y cincuenta. Llega al instituto a las ocho y veinte.
   - choix : 5 h 00 · 7 h 50 · 8 h 20
   - réponse : 8 h 20
   - indice : sale ou llega ? Cherche le mot qui veut dire « arrive ».
   - explication : llega = arrive : le bus arrive au collège à 8 h 20. sale = part : il part de la place à 7 h 50. 5, c’est le numéro du bus.
5. énoncé : "Biblioteca\nde lunes a jueves: de 9:00 a 17:00\nviernes: de 9:00 a 14:00\nsábado y domingo: cerrado"
   - question : Le vendredi, à quelle heure ferme la bibliothèque ?
   - lu : Biblioteca. De lunes a jueves, de nueve a diecisiete. Viernes, de nueve a catorce. Sábado y domingo, cerrado.
   - choix : 9 h 00 · 14 h 00 · 17 h 00
   - réponse : 14 h 00
   - indice : Trouve la ligne viernes, puis lis la deuxième heure.
   - explication : viernes = vendredi : de 9:00 a 14:00, la bibliothèque ferme à 14 h. 17 h, c’est du lundi au jeudi.
6. énoncé : "Secretaría\nlunes, martes y jueves: de 9:00 a 13:00\nmiércoles: cerrado\nviernes: de 9:00 a 12:00"
   - question : Quel jour le secrétariat est-il fermé ?
   - lu : Secretaría. Lunes, martes y jueves, de nueve a trece. Miércoles, cerrado. Viernes, de nueve a doce.
   - choix : Le mercredi · Le mardi · Le jeudi
   - réponse : Le mercredi
   - indice : Cherche le mot cerrado, puis lis le jour de sa ligne.
   - explication : cerrado = fermé : miércoles, le mercredi. martes, c’est mardi ; jueves, jeudi.
7. énoncé : "Profesores de la clase\nInglés: señora Ruiz\nLengua: señor Gómez\nMúsica: señora Vidal"
   - question : Qui enseigne l’anglais ?
   - lu : Profesores de la clase. Inglés, señora Ruiz. Lengua, señor Gómez. Música, señora Vidal.
   - choix : Madame Ruiz · Monsieur Gómez · Madame Vidal
   - réponse : Madame Ruiz
   - indice : Trouve la ligne Inglés.
   - explication : Inglés = l’anglais : señora Ruiz, madame Ruiz. Monsieur Gómez enseigne Lengua, l’espagnol.
8. énoncé : "Horario del instituto\nentrada: 8:30\nsalida: 14:30"
   - question : À quelle heure finissent les cours ?
   - lu : Horario del instituto. Entrada, a las ocho y treinta. Salida, a las catorce y treinta.
   - choix : 8 h 30 · 14 h 30 · 16 h 30
   - réponse : 14 h 30
   - indice : La fin des cours, c’est la sortie : cherche salida.
   - explication : salida = la sortie : les cours finissent à 14 h 30. entrada, c’est l’arrivée. En Espagne, on déjeune souvent après les cours.

### Niveau 2 · `lv2-4e-daily-life-es-timetable-2`

- consigne : Lis la question, puis trouve la bonne ligne du menu ou du programme en espagnol. Le lexique est affiché.

1. énoncé : "Menú del día: 11 euros\nPrimer plato: ensalada\nSegundo plato: pescado con patatas\nPostre: flan o fruta"
   - question : Quel est le plat principal du menu ?
   - lu : Menú del día, once euros. Primer plato, ensalada. Segundo plato, pescado con patatas. Postre, flan o fruta.
   - choix : Du poisson avec des pommes de terre · Une salade · Un flan ou un fruit
   - réponse : Du poisson avec des pommes de terre
   - indice : Le plat principal, c’est le segundo plato.
   - explication : segundo plato = le plat principal : pescado con patatas, du poisson avec des pommes de terre. La salade est l’entrée (primer plato).
   - aide « Leer un menú » :
     - el menú del día = le menu du jour ; infantil = pour enfants
     - primer plato = l’entrée ; segundo plato = le plat principal
     - el postre = le dessert ; el helado = la glace ; la fresa = la fraise
     - la bebida = la boisson ; el zumo = le jus
     - el pescado = le poisson ; las patatas = les pommes de terre
2. énoncé : "Restaurante Sol\nMenú del día: 12 euros\nMenú infantil: 7 euros\nBebida: 2 euros"
   - question : Quel menu coûte 7 euros ?
   - lu : Restaurante Sol. Menú del día, doce euros. Menú infantil, siete euros. Bebida, dos euros.
   - choix : Le menu pour enfants · Le menu du jour · La boisson
   - réponse : Le menu pour enfants
   - indice : Cherche 7 euros, puis lis le début de sa ligne.
   - explication : Menú infantil: 7 euros. infantil veut dire « pour enfants ». Le menu du jour coûte 12 euros ; la boisson, 2 euros.
   - aide « Leer un menú » :
     - el menú del día = le menu du jour ; infantil = pour enfants
     - primer plato = l’entrée ; segundo plato = le plat principal
     - el postre = le dessert ; el helado = la glace ; la fresa = la fraise
     - la bebida = la boisson ; el zumo = le jus
     - el pescado = le poisson ; las patatas = les pommes de terre
3. énoncé : "Postres\nhelado de fresa\nflan de huevo\nfruta del tiempo"
   - question : Quelle glace peux-tu prendre ?
   - lu : Postres. Helado de fresa. Flan de huevo. Fruta del tiempo.
   - choix : Une glace à la fraise · Une glace à la framboise · Une glace au chocolat
   - réponse : Une glace à la fraise
   - indice : helado = glace. Et fresa ?
   - explication : helado de fresa = une glace à la fraise. La framboise se dit frambuesa : les deux mots se ressemblent.
   - aide « Leer un menú » :
     - el menú del día = le menu du jour ; infantil = pour enfants
     - primer plato = l’entrée ; segundo plato = le plat principal
     - el postre = le dessert ; el helado = la glace ; la fresa = la fraise
     - la bebida = la boisson ; el zumo = le jus
     - el pescado = le poisson ; las patatas = les pommes de terre
4. énoncé : "Menú escolar\nPrimer plato: sopa de pollo\nSegundo plato: arroz con verduras\nBebida: agua o zumo de naranja"
   - question : Que peux-tu boire avec le menu ?
   - lu : Menú escolar. Primer plato, sopa de pollo. Segundo plato, arroz con verduras. Bebida, agua o zumo de naranja.
   - choix : De l’eau ou un jus d’orange · Du lait · Une soupe au poulet
   - réponse : De l’eau ou un jus d’orange
   - indice : Boire, c’est la bebida : trouve sa ligne.
   - explication : Bebida = la boisson : agua o zumo de naranja, de l’eau ou un jus d’orange. La soupe au poulet est l’entrée.
   - aide « Leer un menú » :
     - el menú del día = le menu du jour ; infantil = pour enfants
     - primer plato = l’entrée ; segundo plato = le plat principal
     - el postre = le dessert ; el helado = la glace ; la fresa = la fraise
     - la bebida = la boisson ; el zumo = le jus
     - el pescado = le poisson ; las patatas = les pommes de terre
5. énoncé : "Piscina municipal\nde lunes a viernes: de 16:00 a 21:00\nsábado: de 10:00 a 14:00\ndomingo: cerrado"
   - question : Le samedi, à quelle heure ouvre la piscine ?
   - lu : Piscina municipal. De lunes a viernes, de dieciséis a veintiuna horas. Sábado, de diez a catorce horas. Domingo, cerrado.
   - choix : 10 h 00 · 14 h 00 · 16 h 00
   - réponse : 10 h 00
   - indice : Trouve la ligne sábado, puis lis la première heure.
   - explication : sábado = samedi : de 10:00 a 14:00, la piscine ouvre à 10 h et ferme à 14 h. 16 h, c’est du lundi au vendredi.
   - aide « Leer horarios » :
     - cerrado = fermé ; la entrada = le billet
     - el polideportivo = le centre sportif ; el baloncesto = le basket
     - la comida = le déjeuner ; la merienda = le goûter ; la cena = le dîner
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
6. énoncé : "Cine Luna\nLa isla del dragón: 17:30 y 20:00\nentrada: 7 euros\nmiércoles: 5 euros"
   - question : Quel jour le billet coûte-t-il 5 euros ?
   - lu : Cine Luna. La isla del dragón, a las diecisiete y treinta y a las veinte horas. Entrada, siete euros. Miércoles, cinco euros.
   - choix : Le mercredi · Le mardi · Le dimanche
   - réponse : Le mercredi
   - indice : Cherche 5 euros, puis lis le début de sa ligne.
   - explication : miércoles: 5 euros, le mercredi, le billet coûte 5 euros. Les autres jours, la entrada (le billet) coûte 7 euros. martes, c’est mardi.
   - aide « Leer horarios » :
     - cerrado = fermé ; la entrada = le billet
     - el polideportivo = le centre sportif ; el baloncesto = le basket
     - la comida = le déjeuner ; la merienda = le goûter ; la cena = le dîner
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
7. énoncé : "Polideportivo\nFútbol: martes y jueves, 18:00\nBaloncesto: lunes y miércoles, 17:00\nNatación: sábado, 11:00"
   - question : Quels jours y a-t-il du basket ?
   - lu : Polideportivo. Fútbol, martes y jueves, a las dieciocho. Baloncesto, lunes y miércoles, a las diecisiete. Natación, sábado, a las once.
   - choix : Le lundi et le mercredi · Le mardi et le jeudi · Le samedi
   - réponse : Le lundi et le mercredi
   - indice : Le basket se dit baloncesto : trouve sa ligne.
   - explication : el baloncesto = le basket : lunes y miércoles, le lundi et le mercredi. Le football, c’est le mardi et le jeudi.
   - aide « Leer horarios » :
     - cerrado = fermé ; la entrada = le billet
     - el polideportivo = le centre sportif ; el baloncesto = le basket
     - la comida = le déjeuner ; la merienda = le goûter ; la cena = le dîner
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
8. énoncé : "En casa de Lucía\ndesayuno: 7:30\ncomida: 14:30\nmerienda: 18:00\ncena: 21:30"
   - question : À quelle heure dîne la famille de Lucía ?
   - lu : En casa de Lucía. Desayuno, a las siete y treinta. Comida, a las catorce y treinta. Merienda, a las dieciocho. Cena, a las veintiuna y treinta.
   - choix : 14 h 30 · 18 h 00 · 21 h 30
   - réponse : 21 h 30
   - indice : Le dîner se dit la cena.
   - explication : la cena = le dîner : 21 h 30. la comida, c’est le déjeuner (14 h 30). En Espagne, on dîne souvent plus tard qu’en France.
   - aide « Leer horarios » :
     - cerrado = fermé ; la entrada = le billet
     - el polideportivo = le centre sportif ; el baloncesto = le basket
     - la comida = le déjeuner ; la merienda = le goûter ; la cena = le dîner
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45

## Ser, estar, hay · `es-ser-estar`

- description : Être (ser ou estar), il y a (hay), puis tener que, poder, querer.
- compétences : c4.es.langue.temps-verbaux · c4.es.langue.lexique
- lv2 : es
- langue : es
- consigne : Lis ou écoute la question en espagnol, puis choisis la bonne réponse. La règle est affichée.
- bravo : Bien répondu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-es-ser-estar-1`

Pour tous les items :
- aide « Ser, estar, hay » :
  - ser : qui on est, d’où on vient, sa nationalité, le jour.
  - ser : soy, eres, es, somos, sois, son
  - estar : où se trouve quelqu’un ou quelque chose, comment on va.
  - estar : estoy, estás, está, estamos, estáis, están
  - hay = il y a, devant un, una ou un nombre : hay tres sillas.
  - el, la, mi, tu + nom, puis estar : el libro está aquí.

1. énoncé : ¿Dónde está tu mochila?
   - lu : Dónde está tu mochila?
   - choix : Está en mi cuarto. · Es en mi cuarto. · Hay en mi cuarto.
   - réponse : Está en mi cuarto.
   - indice : Où se trouve quelque chose : ser ou estar ?
   - explication : Pour dire où se trouve une chose, on prend estar : está en mi cuarto (il est dans ma chambre). hay veut dire « il y a ».
2. énoncé : ¿De dónde es tu profesora?
   - lu : De dónde es tu profesora?
   - choix : Es de Chile. · Está de Chile. · Hay de Chile.
   - réponse : Es de Chile.
   - indice : D’où on vient : ser ou estar ?
   - explication : D’où on vient se dit avec ser : es de Chile (elle vient du Chili).
3. énoncé : ¿Qué hay en la nevera?
   - lu : Qué hay en la nevera?
   - choix : Hay leche y huevos. · Está leche y huevos. · Es leche y huevos.
   - réponse : Hay leche y huevos.
   - indice : La question demande ce qu’il y a.
   - explication : hay = il y a : hay leche y huevos (il y a du lait et des œufs). hay ne change jamais.
4. énoncé : ¿Cómo estás hoy?
   - lu : Cómo estás hoy?
   - choix : Estoy muy bien. · Soy muy bien. · Hay muy bien.
   - réponse : Estoy muy bien.
   - indice : Comment on va : ser ou estar ?
   - explication : Comment on va se dit avec estar : estoy muy bien (je vais très bien).
5. énoncé : ¿Tu amiga es española?
   - lu : Tu amiga es española?
   - choix : No, es mexicana. · No, está mexicana. · No, hay mexicana.
   - réponse : No, es mexicana.
   - indice : La nationalité : ser ou estar ?
   - explication : La nationalité se dit avec ser : es mexicana (elle est mexicaine).
6. énoncé : ¿Hay una piscina en tu pueblo?
   - lu : Hay una piscina en tu pueblo?
   - choix : Sí, hay una piscina. · Sí, está una piscina. · Sí, es una piscina.
   - réponse : Sí, hay una piscina.
   - indice : Devant una : hay ou estar ?
   - explication : Devant un ou una, on dit hay : sí, hay una piscina (oui, il y a une piscine). es una piscina voudrait dire « c’est une piscine ».
7. énoncé : ¿Dónde están los platos?
   - lu : Dónde están los platos?
   - choix : Están en la mesa. · Hay en la mesa. · Son en la mesa.
   - réponse : Están en la mesa.
   - indice : Où se trouvent les assiettes : ser ou estar ?
   - explication : Où se trouvent des choses : estar. los platos (les assiettes) : están en la mesa (elles sont sur la table).
8. énoncé : ¿Qué día es hoy?
   - lu : Qué día es hoy?
   - choix : Hoy es martes. · Hoy está martes. · Hoy hay martes.
   - réponse : Hoy es martes.
   - indice : Le jour : ser ou estar ?
   - explication : Le jour se dit avec ser : hoy es martes (aujourd’hui, c’est mardi).

### Niveau 2 · `lv2-4e-daily-life-es-ser-estar-2`

- programme : c4.es.langue.modaux-passif

Pour tous les items :
- aide « Tener que, poder, querer » :
  - tener que + infinitif = devoir : tengo que salir (je dois sortir)
  - poder = pouvoir : puedo, puedes, puede, podemos
  - querer = vouloir : quiero, quieres, quiere, queremos
  - o devient ue, e devient ie, sauf avec nosotros et vosotros.
  - Le 2e verbe reste à l’infinitif : quiero comer (je veux manger).
  - entrenar = s’entraîner ; ordenar = ranger ; nadar = nager

1. énoncé : ¿Vienes al parque?
   - lu : Vienes al parque?
   - choix : No, tengo que entrenar. · No, tengo entrenar. · No, tengo de entrenar.
   - réponse : No, tengo que entrenar.
   - indice : Devoir se dit tener que + infinitif.
   - explication : tener que + infinitif = devoir : tengo que entrenar (je dois m’entraîner). tener que s’écrit toujours avec que, jamais avec de.
2. énoncé : ¿Puedes jugar el sábado?
   - lu : Puedes jugar el sábado?
   - choix : Sí, puedo jugar. · Sí, podo jugar. · Sí, puedo juego.
   - réponse : Sí, puedo jugar.
   - indice : poder : o devient ue. Et le 2e verbe reste à l’infinitif.
   - explication : poder : puedo (je peux), le o devient ue. Le 2e verbe reste à l’infinitif : puedo jugar.
3. énoncé : ¿Quieres ir a la piscina?
   - lu : Quieres ir a la piscina?
   - choix : Sí, quiero ir. · Sí, quero ir. · Sí, quiero voy.
   - réponse : Sí, quiero ir.
   - indice : querer : e devient ie. Et le 2e verbe reste à l’infinitif.
   - explication : querer : quiero (je veux), le e devient ie. Le 2e verbe reste à l’infinitif : quiero ir (je veux y aller).
4. énoncé : ¿Qué tienes que hacer hoy?
   - lu : Qué tienes que hacer hoy?
   - choix : Tengo que ordenar mi cuarto. · Tengo ordenar mi cuarto. · Tengo de ordenar mi cuarto.
   - réponse : Tengo que ordenar mi cuarto.
   - indice : Devoir se dit tener que + infinitif.
   - explication : tengo que ordenar mi cuarto = je dois ranger ma chambre. tener que, avec que, jamais de.
5. énoncé : ¿Puede Lucía venir a la fiesta?
   - lu : Puede Lucía venir a la fiesta?
   - choix : No, no puede venir. · No, no pode venir. · No, no puede viene.
   - réponse : No, no puede venir.
   - indice : poder : o devient ue avec ella. Et venir reste à l’infinitif.
   - explication : Pour Lucía (ella) : puede, le o devient ue. Le 2e verbe reste à l’infinitif : no puede venir (elle ne peut pas venir).
6. énoncé : ¿Qué quiere hacer tu hermano?
   - lu : Qué quiere hacer tu hermano?
   - choix : Quiere aprender a nadar. · Quere aprender a nadar. · Quiere aprende a nadar.
   - réponse : Quiere aprender a nadar.
   - indice : querer : e devient ie avec él. Et le 2e verbe reste à l’infinitif.
   - explication : Pour ton frère (él) : quiere, le e devient ie. Puis l’infinitif : quiere aprender a nadar (il veut apprendre à nager).
7. énoncé : ¿Tus amigos quieren jugar al baloncesto?
   - lu : Tus amigos quieren jugar al baloncesto?
   - choix : Sí, quieren jugar. · Sí, queren jugar. · Sí, quieren juegan.
   - réponse : Sí, quieren jugar.
   - indice : querer : e devient ie avec ellos. Et le 2e verbe ?
   - explication : Pour tes amis (ellos) : quieren, le e devient ie. Le 2e verbe reste à l’infinitif : quieren jugar (ils veulent jouer).
8. énoncé : ¿Vienes a mi casa esta tarde?
   - lu : Vienes a mi casa esta tarde?
   - choix : Lo siento, no puedo. · Lo siento, no podo. · Lo siento, no puede.
   - réponse : Lo siento, no puedo.
   - indice : Tu réponds pour toi, avec poder.
   - explication : Pour soi (yo) : puedo, le o devient ue. Lo siento, no puedo = désolé, je ne peux pas. puede, c’est pour él ou ella.

## Carteles y mensajes · `es-signs`

- description : Un panneau, une consigne, un petit message ; puis réagir à une proposition, dire ce qu’on ressent.
- compétences : c4.es.lire.consignes-panneaux · c4.es.dialoguer.reagir
- lv2 : es
- langue : es
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-es-signs-1`

- consigne : Lis la question, puis trouve la bonne ligne du panneau ou du message en espagnol. Le lexique est affiché.
- bravo : Bien lu !

Pour tous les items :
- langue des choix : fr
- aide « Leer carteles y mensajes » :
  - prohibido = interdit ; obligatorio = obligatoire
  - se puede = on peut ; no se puede = on ne peut pas
  - a la derecha = à droite ; a la izquierda = à gauche
  - lee = lis ; responde = réponds ; escribe = écris
  - nos vemos = on se voit ; vuelvo = je reviens
  - 7:15 = 7 h 15 ; 16:45 = 16 h 45

1. énoncé : "Piscina municipal\nProhibido comer y beber\nObligatorio: gorro de baño"
   - question : À la piscine, que dois-tu porter ?
   - lu : Piscina municipal. Prohibido comer y beber. Obligatorio: gorro de baño.
   - choix : Un bonnet de bain · Des lunettes de soleil · Un sac de sport
   - réponse : Un bonnet de bain
   - indice : Cherche la ligne Obligatorio. baño ressemble à bain.
   - explication : Obligatorio: gorro de baño = le bonnet de bain est obligatoire. Prohibido comer y beber : manger et boire sont interdits.
2. énoncé : "Biblioteca\nNo se puede usar el móvil.\nHabla en voz baja."
   - question : Qu’est-ce qu’on ne peut pas faire à la bibliothèque ?
   - lu : Biblioteca. No se puede usar el móvil. Habla en voz baja.
   - choix : Utiliser le portable · Emprunter des livres · Parler à voix basse
   - réponse : Utiliser le portable
   - indice : Cherche la ligne qui commence par No se puede. el móvil ressemble à mobile.
   - explication : No se puede usar el móvil = on ne peut pas utiliser le portable. Habla en voz baja = parle à voix basse : ça, on peut le faire.
3. énoncé : "Instrucciones\n1. Lee el texto.\n2. Responde a las preguntas en español.\n3. Escribe tu nombre arriba."
   - question : En quelle langue dois-tu répondre aux questions ?
   - lu : Instrucciones. Uno: lee el texto. Dos: responde a las preguntas en español. Tres: escribe tu nombre arriba.
   - choix : En espagnol · En français · En anglais
   - réponse : En espagnol
   - indice : Cherche la consigne qui commence par Responde.
   - explication : Responde a las preguntas en español = réponds aux questions en espagnol. Lee el texto = lis le texte ; escribe tu nombre = écris ton prénom.
4. énoncé : "¡Hola, Leo!\nMañana no hay clase de música.\nNos vemos a las 10 en el parque.\nUn abrazo, Sara"
   - question : Où Sara te donne-t-elle rendez-vous ?
   - lu : Hola, Leo! Mañana no hay clase de música. Nos vemos a las diez en el parque. Un abrazo, Sara.
   - choix : Au parc · Au cours de musique · Chez Leo
   - réponse : Au parc
   - indice : Cherche la ligne Nos vemos (on se voit).
   - explication : Nos vemos a las 10 en el parque = on se voit à 10 h au parc. No hay clase de música = il n’y a pas de cours de musique.
5. énoncé : "Mamá:\nEstoy en casa de Lucas.\nVuelvo a las 19:00.\nBesos, Hugo"
   - question : À quelle heure Hugo rentre-t-il ?
   - lu : Mamá: estoy en casa de Lucas. Vuelvo a las diecinueve. Besos, Hugo.
   - choix : 9 h 00 · 17 h 00 · 19 h 00
   - réponse : 19 h 00
   - indice : Cherche la ligne Vuelvo (je reviens).
   - explication : Vuelvo a las 19:00 = je reviens à 19 h : diecinueve, c’est 19. nueve, c’est 9 ; diecisiete, 17.
6. énoncé : "Parque de la Ribera\nProhibido jugar a la pelota\nZona de pícnic: a la derecha"
   - question : Que peux-tu faire à droite ?
   - lu : Parque de la Ribera. Prohibido jugar a la pelota. Zona de pícnic: a la derecha.
   - choix : Pique-niquer · Jouer au ballon · Faire du vélo
   - réponse : Pique-niquer
   - indice : Cherche la ligne a la derecha (à droite).
   - explication : Zona de pícnic: a la derecha = le coin pique-nique est à droite. Jugar a la pelota (jouer au ballon) est prohibido, interdit.
7. énoncé : "Excursión al museo: el jueves\nSalida del instituto: 8:15\nTraed un bocadillo."
   - question : Quel jour a lieu la sortie au musée ?
   - lu : Excursión al museo: el jueves. Salida del instituto: a las ocho y quince. Traed un bocadillo.
   - choix : Le mardi · Le jeudi · Le vendredi
   - réponse : Le jeudi
   - indice : Lis la 1re ligne. jueves ou viernes ?
   - explication : el jueves = le jeudi. Le mardi se dit martes ; le vendredi, viernes. La salida, ici, c’est le départ du collège à 8 h 15.
8. énoncé : "¡Ojo!\nSuelo mojado"
   - question : Pourquoi ce panneau te dit-il de faire attention ?
   - lu : Ojo! Suelo mojado.
   - choix : Le sol est mouillé · La porte est cassée · Le chien est méchant
   - réponse : Le sol est mouillé
   - indice : ¡Ojo! veut dire attention. Regarde la 2e ligne : el suelo = le sol.
   - explication : Suelo mojado = sol mouillé : attention, on peut glisser. ¡Ojo! veut dire attention.

### Niveau 2 · `lv2-4e-daily-life-es-signs-2`

- consigne : Lis ou écoute la phrase en espagnol, puis choisis la bonne réaction. La règle est affichée.
- bravo : Bien répondu !

Pour tous les items :
- aide « Reaccionar » :
  - ¡Genial! ¡Qué bien! = super ! ; sin problema = pas de problème
  - claro = bien sûr ; ni hablar = pas question
  - ¡Qué pena! = dommage ; ¡Ánimo! = courage ! ; tengo miedo = j’ai peur
  - yo también = moi aussi ; yo tampoco = moi non plus
  - tengo frío = j’ai froid ; tengo calor = j’ai chaud
  - tengo hambre = j’ai faim ; tengo sed = j’ai soif

1. énoncé : ¿Jugamos al ajedrez esta tarde?
   - lu : Jugamos al ajedrez esta tarde?
   - choix : ¡Genial! · ¡Ánimo! · Yo tampoco.
   - réponse : ¡Genial!
   - indice : On te propose de jouer aux échecs : tu acceptes.
   - explication : ¿Jugamos? = on joue ? Pour accepter : ¡Genial! (super !). ¡Ánimo! encourage quelqu’un ; yo tampoco répond à une phrase avec no.
2. énoncé : ¿Vamos a correr a las seis de la mañana?
   - lu : Vamos a correr a las seis de la mañana?
   - choix : ¡Ni hablar! · Yo también. · De nada.
   - réponse : ¡Ni hablar!
   - indice : Courir à six heures du matin ? Tu refuses.
   - explication : ¡Ni hablar! = pas question : tu refuses. Plus poliment, on dit : Lo siento, no puedo. Yo también ne répond pas à une question ; de nada répond à gracias.
3. énoncé : Mi gato está enfermo.
   - lu : Mi gato está enfermo.
   - choix : ¡Qué pena! · ¡Genial! · ¡Qué bien!
   - réponse : ¡Qué pena!
   - indice : enfermo = malade. C’est une bonne ou une mauvaise nouvelle ?
   - explication : Son chat est malade : c’est triste, on dit ¡Qué pena! (dommage, c’est triste). ¡Genial! et ¡Qué bien! sont pour une bonne nouvelle.
4. énoncé : ¿Por qué no bebes agua?
   - lu : Por qué no bebes agua?
   - choix : No tengo sed. · No tengo hambre. · No tengo frío.
   - réponse : No tengo sed.
   - indice : Quand on ne boit pas, c’est qu’on n’a pas soif ou pas faim ?
   - explication : No tengo sed = je n’ai pas soif : c’est pour ça qu’on ne boit pas. hambre, c’est la faim ; frío, le froid.
5. énoncé : ¿Por qué llevas el abrigo?
   - lu : Por qué llevas el abrigo?
   - choix : Porque tengo frío. · Porque tengo calor. · Porque tengo sed.
   - réponse : Porque tengo frío.
   - indice : el abrigo = le manteau. Pourquoi met-on un manteau ?
   - explication : On met un manteau (el abrigo) parce qu’on a froid : porque tengo frío. Tengo calor veut dire j’ai chaud.
6. énoncé : ¡Ganamos el partido!
   - lu : Ganamos el partido!
   - choix : ¡Qué bien! · ¡Qué pena! · Lo siento.
   - réponse : ¡Qué bien!
   - indice : ganar = gagner. C’est une bonne ou une mauvaise nouvelle ?
   - explication : ¡Ganamos el partido! = on a gagné le match ! C’est une bonne nouvelle : ¡Qué bien! (super !). ¡Qué pena! et lo siento sont pour une mauvaise nouvelle.
7. énoncé : Mañana tengo un examen y tengo miedo.
   - lu : Mañana tengo un examen y tengo miedo.
   - choix : ¡Ánimo! · ¡Buen provecho! · ¡Feliz cumpleaños!
   - réponse : ¡Ánimo!
   - indice : Ton ami a peur de son examen. Que lui dis-tu pour l’aider ?
   - explication : Ton ami a peur de son examen : tu l’encourages avec ¡Ánimo! (courage !). ¡Buen provecho! se dit avant de manger ; ¡Feliz cumpleaños!, pour un anniversaire.
8. énoncé : No entiendo. ¿Puedes repetir, por favor?
   - lu : No entiendo. Puedes repetir, por favor?
   - choix : Sí, claro. · De nada. · ¡Qué pena!
   - réponse : Sí, claro.
   - indice : Ton ami n’a pas compris : il te demande de répéter.
   - explication : ¿Puedes repetir? = tu peux répéter ? On accepte : Sí, claro (oui, bien sûr), puis on redit plus lentement. De nada répond à gracias.

## Wie spät ist es? · `de-time`

- description : L’heure entendue : Viertel nach, halb ; puis où est-on, qui parle ?
- compétences : c4.de.ecouter.intervention-breve · c4.de.dialoguer.echanges-sociaux · c4.de.langue.lexique
- lv2 : de
- langue : de
- bravo : Bien compris !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- langue des choix : fr

### Niveau 1 · `lv2-4e-daily-life-de-time-1`

- consigne : Appuie sur Écouter pour entendre l’heure en allemand, puis choisis la bonne heure. La règle est affichée.

Pour tous les items :
- aide « Die Uhrzeit » :
  - Wie spät ist es? = Quelle heure est-il ?
  - Es ist ein Uhr (1 h), es ist zwei Uhr (2 h).
  - Viertel nach = et quart ; Viertel vor = moins le quart
  - halb + l’heure suivante : halb acht = 7 h 30
  - fünf nach = et cinq ; zwanzig vor = moins vingt
  - morgens = le matin ; abends = le soir

1. énoncé : Es ist Viertel nach drei.
   - lu : Es ist Viertel nach drei.
   - choix : 2 h 15 · 2 h 45 · 3 h 15
   - réponse : 3 h 15
   - indice : nach ou vor ? nach ajoute des minutes, vor en retire.
   - explication : Viertel nach drei = le quart après 3 h = 3 h 15. Seul halb compte vers l’heure suivante : 2 h 15 se dirait Viertel nach zwei, 2 h 45 Viertel vor drei.
2. énoncé : Es ist halb fünf.
   - lu : Es ist halb fünf.
   - choix : 4 h 30 · 5 h 00 · 5 h 30
   - réponse : 4 h 30
   - indice : halb compte vers l’heure suivante : la demie avant 5 h.
   - explication : halb fünf = la demie avant 5 h = 4 h 30. En allemand, on compte vers l’heure qui vient : ce n’est pas 5 h 30.
3. énoncé : Es ist Viertel vor zehn.
   - lu : Es ist Viertel vor zehn.
   - choix : 9 h 15 · 9 h 45 · 10 h 15
   - réponse : 9 h 45
   - indice : vor, c’est avant : on retire un quart d’heure à 10 h.
   - explication : Viertel vor zehn = le quart avant 10 h = 9 h 45. 10 h 15 se dirait Viertel nach zehn ; 9 h 15, Viertel nach neun.
4. énoncé : Es ist zehn nach eins.
   - lu : Es ist zehn nach eins.
   - choix : 1 h 10 · 10 h 00 · 12 h 50
   - réponse : 1 h 10
   - indice : Les minutes d’abord, puis nach, puis l’heure.
   - explication : zehn nach eins = dix minutes après 1 h = 1 h 10. 12 h 50 se dirait zehn vor eins.
5. énoncé : Es ist fünf vor sieben.
   - lu : Es ist fünf vor sieben.
   - choix : 6 h 05 · 6 h 55 · 7 h 05
   - réponse : 6 h 55
   - indice : vor : on retire 5 minutes à 7 h.
   - explication : fünf vor sieben = cinq minutes avant 7 h = 6 h 55. 7 h 05 se dirait fünf nach sieben ; 6 h 05, fünf nach sechs.
6. énoncé : Es ist halb zwölf.
   - lu : Es ist halb zwölf.
   - choix : 1 h 30 · 11 h 30 · 12 h 30
   - réponse : 11 h 30
   - indice : halb compte vers l’heure suivante. Et zwölf, c’est 12.
   - explication : halb zwölf = la demie avant 12 h = 11 h 30. halb compte vers l’heure qui vient. 1 h 30 se dirait halb zwei.
7. énoncé : Es ist sieben Uhr abends.
   - lu : Es ist sieben Uhr abends.
   - choix : 7 h 00 · 17 h 00 · 19 h 00
   - réponse : 19 h 00
   - indice : abends : le soir. Et sieben, c’est 7.
   - explication : sieben Uhr abends = 7 h du soir = 19 h. 7 h se dirait sieben Uhr morgens ; 17, c’est siebzehn.
8. énoncé : Es ist neun Uhr morgens.
   - lu : Es ist neun Uhr morgens.
   - choix : 9 h 00 · 19 h 00 · 21 h 00
   - réponse : 9 h 00
   - indice : morgens : le matin.
   - explication : neun Uhr morgens = 9 h du matin. 21 h se dirait neun Uhr abends.

### Niveau 2 · `lv2-4e-daily-life-de-time-2`

- consigne : Cette fois, une scène de la journée : lis la question, puis appuie sur Écouter pour entendre la phrase en allemand. Le lexique est affiché.
- programme : c4.de.ecouter.indices

Pour tous les items :
- aide « Wer spricht? Wo sind wir? » :
  - der Tisch = la table ; die Karte = le billet
  - der Zug fährt ab = le train part ; das Gleis = la voie
  - nehmt heraus = sortez (à toute la classe) ; das Heft = le cahier
  - Gute Nacht = bonne nuit ; das Abendessen = le dîner
  - die Zwiebel = l’oignon ; die Pfanne = la poêle

1. énoncé : Guten Abend! Einen Tisch für zwei?
   - question : Où est-on ?
   - lu : Guten Abend! Einen Tisch für zwei?
   - choix : Au restaurant · À la gare · Au collège
   - réponse : Au restaurant
   - indice : Cherche le mot Tisch dans le lexique.
   - explication : einen Tisch für zwei = une table pour deux : on est au restaurant.
2. énoncé : Ruhe, bitte! Nehmt eure Hefte heraus.
   - question : Qui parle ?
   - lu : Ruhe, bitte! Nehmt eure Hefte heraus.
   - choix : Un professeur · Un serveur · Un vendeur
   - réponse : Un professeur
   - indice : Regarde le lexique : nehmt heraus.
   - explication : Ruhe, bitte! = du calme, s’il vous plaît ; nehmt eure Hefte heraus = sortez vos cahiers. C’est un professeur qui parle à sa classe.
3. énoncé : Der Zug nach Berlin fährt von Gleis zwei ab.
   - question : Où est-on ?
   - lu : Der Zug nach Berlin fährt von Gleis zwei ab.
   - choix : À la gare · À l’arrêt de bus · À la piscine
   - réponse : À la gare
   - indice : Regarde le lexique : der Zug, das Gleis.
   - explication : der Zug fährt von Gleis zwei ab = le train part de la voie 2 : on est à la gare.
4. énoncé : Das macht vier Euro fünfzig, bitte.
   - question : Qui parle ?
   - lu : Das macht vier Euro fünfzig, bitte.
   - choix : Un vendeur · Un professeur · Un élève
   - réponse : Un vendeur
   - indice : Qui dit un prix ?
   - explication : Das macht vier Euro fünfzig = ça fait 4 euros 50 : c’est un prix, donc un vendeur.
5. énoncé : Gute Nacht! Ich gehe ins Bett.
   - question : À quel moment de la journée est-on ?
   - lu : Gute Nacht! Ich gehe ins Bett.
   - choix : Le soir · Le matin · À midi
   - réponse : Le soir
   - indice : Regarde le lexique : Gute Nacht.
   - explication : Gute Nacht = bonne nuit ; ich gehe ins Bett = je vais au lit. C’est le soir.
6. énoncé : Zwei Karten für den Film um acht, bitte.
   - question : Où est-on ?
   - lu : Zwei Karten für den Film um acht, bitte.
   - choix : Au cinéma · Au restaurant · À la gare
   - réponse : Au cinéma
   - indice : Regarde le lexique : die Karte.
   - explication : zwei Karten = deux billets ; für den Film um acht = pour le film de 20 h. On est au cinéma.
7. énoncé : Mama, was gibt es zum Abendessen?
   - question : Qui parle ?
   - lu : Mama, was gibt es zum Abendessen?
   - choix : Un enfant à sa mère · Un serveur à un client · Un professeur à un élève
   - réponse : Un enfant à sa mère
   - indice : Écoute le premier mot de la phrase.
   - explication : Mama = maman ; was gibt es zum Abendessen? = qu’est-ce qu’il y a pour le dîner ? C’est un enfant qui parle à sa mère.
8. énoncé : Zuerst die Zwiebel schneiden, dann in die Pfanne.
   - question : Où est-on ?
   - lu : Zuerst die Zwiebel schneiden, dann in die Pfanne.
   - choix : Dans une cuisine · Dans une classe · Dans un magasin
   - réponse : Dans une cuisine
   - indice : Cherche die Zwiebel et die Pfanne dans le lexique.
   - explication : die Zwiebel schneiden = couper l’oignon ; in die Pfanne = dans la poêle. On prépare un plat : on est dans une cuisine.

## Mein Tag · `de-my-day`

- description : La journée : le verbe en deuxième place, puis la particule à la fin.
- compétences : c4.de.langue.temps-verbaux · c4.de.langue.lexique
- lv2 : de
- langue : de
- consigne : Lis ou écoute la question en allemand, puis choisis la bonne réponse. La règle est affichée.
- bravo : Bien répondu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-de-my-day-1`

Pour tous les items :
- aide « Mein Tag : le verbe en 2e place » :
  - Le verbe conjugué est toujours en 2e place : si la phrase commence par l’heure, le sujet passe après.
  - Heute spiele ich. (aujourd’hui, je joue)
  - frühstücken = prendre le petit-déjeuner ; duschen = se doucher
  - lesen = lire ; trinken = boire ; essen : ich esse, sie isst
  - morgens, mittags, abends = le matin, à midi, le soir
  - zuerst = d’abord ; zu Abend essen = dîner

1. énoncé : Wann frühstückst du?
   - lu : Wann frühstückst du?
   - choix : Um sieben frühstücke ich. · Um sieben ich frühstücke. · Ich um sieben frühstücke.
   - réponse : Um sieben frühstücke ich.
   - indice : Um sieben est en 1re place. Où va le verbe ?
   - explication : Um sieben frühstücke ich = à 7 h, je prends mon petit-déjeuner. Le verbe va en 2e place : si la phrase commence par l’heure, le sujet vient après.
2. énoncé : Wann duschst du?
   - lu : Wann duschst du?
   - choix : Morgens dusche ich. · Morgens ich dusche. · Ich morgens dusche.
   - réponse : Morgens dusche ich.
   - indice : Morgens est en 1re place. Où va le verbe ?
   - explication : Morgens dusche ich = le matin, je me douche. Le verbe dusche est en 2e place, ich vient après.
3. énoncé : Was machst du abends?
   - lu : Was machst du abends?
   - choix : Abends lese ich. · Abends ich lese. · Ich abends lese.
   - réponse : Abends lese ich.
   - indice : Abends est en 1re place. Où va le verbe ?
   - explication : Abends lese ich = le soir, je lis. Le verbe lese est en 2e place, ich vient après.
4. énoncé : Was machst du nach der Schule?
   - lu : Was machst du nach der Schule?
   - choix : Zuerst mache ich Hausaufgaben. · Zuerst ich mache Hausaufgaben. · Ich zuerst mache Hausaufgaben.
   - réponse : Zuerst mache ich Hausaufgaben.
   - indice : Zuerst est en 1re place. Où va le verbe ?
   - explication : Zuerst mache ich Hausaufgaben = d’abord, je fais mes devoirs. Le verbe mache est en 2e place, ich vient après.
5. énoncé : Wann esst ihr zu Abend?
   - lu : Wann esst ihr zu Abend?
   - choix : Um sechs essen wir. · Um sechs wir essen. · Wir um sechs essen.
   - réponse : Um sechs essen wir.
   - indice : Um sechs est en 1re place. Où va le verbe ?
   - explication : Um sechs essen wir = à 18 h, nous dînons. Le verbe en 2e place, le sujet après. En Allemagne, on dîne souvent tôt.
6. énoncé : Wann frühstückt Paul?
   - lu : Wann frühstückt Paul?
   - choix : Um acht frühstückt er. · Um acht er frühstückt. · Um acht frühstücke er.
   - réponse : Um acht frühstückt er.
   - indice : Le verbe en 2e place, avec la fin de er : -t.
   - explication : Um acht frühstückt er = à 8 h, il prend son petit-déjeuner. Le verbe en 2e place ; avec er, il finit par -t.
7. énoncé : Was macht deine Schwester mittags?
   - lu : Was macht deine Schwester mittags?
   - choix : Mittags isst sie Nudeln. · Mittags sie isst Nudeln. · Mittags esst sie Nudeln.
   - réponse : Mittags isst sie Nudeln.
   - indice : Le verbe en 2e place. Et essen avec sie : regarde la règle.
   - explication : Mittags isst sie Nudeln = à midi, elle mange des pâtes. Le verbe en 2e place ; essen donne sie isst.
8. énoncé : Wann trinkst du Kakao?
   - lu : Wann trinkst du Kakao?
   - choix : Morgens trinke ich Kakao. · Morgens ich trinke Kakao. · Ich morgens trinke Kakao.
   - réponse : Morgens trinke ich Kakao.
   - indice : Morgens est en 1re place. Où va le verbe ?
   - explication : Morgens trinke ich Kakao = le matin, je bois du chocolat. Le verbe trinke est en 2e place, ich vient après.

### Niveau 2 · `lv2-4e-daily-life-de-my-day-2`

Pour tous les items :
- aide « Les verbes à particule » :
  - aufstehen = se lever ; fernsehen = regarder la télé
  - anfangen = commencer ; aufräumen = ranger ; anrufen = appeler
  - mitkommen = venir avec ; zumachen = fermer ; ankommen = arriver
  - Le verbe en 2e place, sa particule tout à la fin.
  - einkaufen : Samstags kaufe ich ein. (je fais les courses)
  - Particules : auf, an, ein, fern, mit, zu.

1. énoncé : Wann stehst du auf?
   - lu : Wann stehst du auf?
   - choix : Ich stehe um sieben auf. · Ich aufstehe um sieben. · Um sieben ich stehe auf.
   - réponse : Ich stehe um sieben auf.
   - indice : Le verbe en 2e place, sa particule tout à la fin.
   - explication : aufstehen : ich stehe um sieben auf (je me lève à 7 h). La particule auf part à la fin de la phrase.
2. énoncé : Wann fängt die Schule an?
   - lu : Wann fängt die Schule an?
   - choix : Sie fängt um acht an. · Sie anfängt um acht. · Sie fangt um acht an.
   - réponse : Sie fängt um acht an.
   - indice : Le verbe en 2e place, sa particule tout à la fin. Et regarde bien le ä.
   - explication : anfangen : sie fängt um acht an (elle commence à 8 h). La particule an va à la fin ; avec sie, fangen prend un ä.
3. énoncé : Was machst du nach dem Abendessen?
   - lu : Was machst du nach dem Abendessen?
   - choix : Dann sehe ich fern. · Dann fernsehe ich. · Dann ich sehe fern.
   - réponse : Dann sehe ich fern.
   - indice : Dann en 1re place, le verbe en 2e, la particule à la fin.
   - explication : fernsehen : dann sehe ich fern (ensuite, je regarde la télé). Le verbe en 2e place, fern à la fin.
4. énoncé : Rufst du Oma an?
   - lu : Rufst du Oma an?
   - choix : Ja, ich rufe sie an. · Ja, ich anrufe sie. · Ja, ich rufe an sie.
   - réponse : Ja, ich rufe sie an.
   - indice : Le verbe en 2e place, sa particule tout à la fin.
   - explication : anrufen : ich rufe sie an (je l’appelle). La particule an va tout à la fin, après sie.
5. énoncé : Kommst du mit zum Schwimmbad?
   - lu : Kommst du mit zum Schwimmbad?
   - choix : Ja, ich komme mit. · Ja, ich mitkomme. · Ja, ich kommst mit.
   - réponse : Ja, ich komme mit.
   - indice : Le verbe en 2e place, sa particule tout à la fin. Et la fin du verbe avec ich ?
   - explication : mitkommen : ja, ich komme mit (oui, je viens avec toi). mit va à la fin ; avec ich, le verbe finit par -e.
6. énoncé : Was macht Paul am Samstag?
   - lu : Was macht Paul am Samstag?
   - choix : Er räumt sein Zimmer auf. · Er aufräumt sein Zimmer. · Er räumt auf sein Zimmer.
   - réponse : Er räumt sein Zimmer auf.
   - indice : Le verbe en 2e place, sa particule tout à la fin.
   - explication : aufräumen : er räumt sein Zimmer auf (il range sa chambre). La particule auf va tout à la fin, après sein Zimmer.
7. énoncé : Wann kommt der Bus an?
   - lu : Wann kommt der Bus an?
   - choix : Er kommt um acht an. · Er ankommt um acht. · Um acht er kommt an.
   - réponse : Er kommt um acht an.
   - indice : Le verbe en 2e place, sa particule tout à la fin.
   - explication : ankommen : er kommt um acht an (il arrive à 8 h). Le verbe en 2e place, an à la fin.
8. énoncé : Machst du das Fenster zu?
   - lu : Machst du das Fenster zu?
   - choix : Ja, ich mache es zu. · Ja, ich zumache es. · Ja, ich mache zu es.
   - réponse : Ja, ich mache es zu.
   - indice : Le verbe en 2e place, sa particule tout à la fin.
   - explication : zumachen : ja, ich mache es zu (oui, je la ferme). La particule zu va tout à la fin, après es.

## Stundenplan und Mensa · `de-timetable`

- description : Un emploi du temps, un menu, un programme de loisirs : la bonne ligne.
- compétences : c4.de.lire.informations · c4.de.culture.ecole-societe · c4.de.langue.lexique
- lv2 : de
- langue : de
- bravo : Bien lu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- langue des choix : fr

### Niveau 1 · `lv2-4e-daily-life-de-timetable-1`

- consigne : Lis la question, puis trouve la bonne ligne du document en allemand. Le lexique est affiché.

Pour tous les items :
- aide « Einen Stundenplan lesen » :
  - Montag, Dienstag, Mittwoch = lundi, mardi, mercredi
  - Donnerstag, Freitag, Samstag = jeudi, vendredi, samedi
  - die Pause = la récréation ; der Unterricht = les cours
  - Deutsch = l’allemand ; Erdkunde = la géographie ; Kunst = le dessin
  - ab = départ ; an = arrivée ; geschlossen = fermé ; bis = jusqu’à
  - 7:15 = 7 h 15 ; 16:45 = 16 h 45

1. énoncé : "Montag\n8:00 Mathe\n8:45 Deutsch\n9:30 Pause\n9:50 Englisch"
   - question : Le lundi, quel cours as-tu à 8 h ?
   - lu : Montag. Acht Uhr, Mathe. Acht Uhr fünfundvierzig, Deutsch. Neun Uhr dreißig, Pause. Neun Uhr fünfzig, Englisch.
   - choix : Maths · Allemand · Anglais
   - réponse : Maths
   - indice : Trouve la ligne qui commence par 8 h, puis lis la matière.
   - explication : 8:00 Mathe : à 8 h, tu as maths. Deutsch (l’allemand) est à 8 h 45, Englisch (l’anglais) à 9 h 50.
2. énoncé : "Dienstag\n7:55 Erdkunde\n8:40 Biologie\n9:25 Pause\n9:45 Kunst"
   - question : Le mardi, à quelle heure est la récréation ?
   - lu : Dienstag. Sieben Uhr fünfundfünfzig, Erdkunde. Acht Uhr vierzig, Biologie. Neun Uhr fünfundzwanzig, Pause. Neun Uhr fünfundvierzig, Kunst.
   - choix : 8 h 40 · 9 h 25 · 9 h 45
   - réponse : 9 h 25
   - indice : Cherche le mot Pause, puis lis l’heure de sa ligne.
   - explication : die Pause = la récréation : sa ligne dit 9:25, donc 9 h 25. À 9 h 45, c’est Kunst.
3. énoncé : "Mein Stundenplan\nMathe: Montag und Donnerstag\nSport: Dienstag und Freitag\nMusik: Mittwoch"
   - question : Quels jours as-tu sport ?
   - lu : Mein Stundenplan. Mathe, Montag und Donnerstag. Sport, Dienstag und Freitag. Musik, Mittwoch.
   - choix : Le mardi et le vendredi · Le jeudi et le vendredi · Le lundi et le jeudi
   - réponse : Le mardi et le vendredi
   - indice : Trouve la ligne Sport. Attention : Dienstag ou Donnerstag ?
   - explication : Sport : Dienstag und Freitag, le mardi et le vendredi. Dienstag = mardi ; Donnerstag = jeudi.
4. énoncé : "Bus 7 zur Schule\nab Bahnhof: 7:20\nan Schule: 7:45"
   - question : À quelle heure le bus arrive-t-il au collège ?
   - lu : Bus sieben zur Schule. Ab Bahnhof, sieben Uhr zwanzig. An Schule, sieben Uhr fünfundvierzig.
   - choix : 7 h 00 · 7 h 20 · 7 h 45
   - réponse : 7 h 45
   - indice : ab ou an ? Cherche le mot qui veut dire « arrivée ».
   - explication : an = arrivée : le bus arrive au collège à 7 h 45. ab = départ : il part de la gare à 7 h 20. 7, c’est le numéro du bus.
5. énoncé : "Bibliothek\nMontag bis Donnerstag: 9:00 bis 17:00\nFreitag: 9:00 bis 14:00\nSamstag und Sonntag: geschlossen"
   - question : Le vendredi, à quelle heure ferme la bibliothèque ?
   - lu : Bibliothek. Montag bis Donnerstag, neun bis siebzehn Uhr. Freitag, neun bis vierzehn Uhr. Samstag und Sonntag, geschlossen.
   - choix : 9 h 00 · 14 h 00 · 17 h 00
   - réponse : 14 h 00
   - indice : Trouve la ligne Freitag, puis lis l’heure après bis.
   - explication : Freitag = vendredi : 9:00 bis 14:00, la bibliothèque ferme à 14 h. 17 h, c’est du lundi au jeudi.
6. énoncé : "Sekretariat\nMontag, Dienstag, Donnerstag: 8:00 bis 12:00\nMittwoch: geschlossen\nFreitag: 8:00 bis 11:00"
   - question : Quel jour le secrétariat est-il fermé ?
   - lu : Sekretariat. Montag, Dienstag, Donnerstag, acht bis zwölf Uhr. Mittwoch, geschlossen. Freitag, acht bis elf Uhr.
   - choix : Le mercredi · Le mardi · Le jeudi
   - réponse : Le mercredi
   - indice : Cherche le mot geschlossen, puis lis le jour de sa ligne.
   - explication : geschlossen = fermé : Mittwoch, le mercredi. Dienstag, c’est mardi ; Donnerstag, jeudi.
7. énoncé : "Lehrer der Klasse 8b\nEnglisch: Frau Keller\nDeutsch: Herr Braun\nMusik: Frau Yilmaz"
   - question : Qui enseigne l’anglais ?
   - lu : Lehrer der Klasse acht b. Englisch, Frau Keller. Deutsch, Herr Braun. Musik, Frau Yilmaz.
   - choix : Madame Keller · Monsieur Braun · Madame Yilmaz
   - réponse : Madame Keller
   - indice : Trouve la ligne Englisch.
   - explication : Englisch = l’anglais : Frau Keller, madame Keller. Herr Braun enseigne Deutsch, l’allemand.
8. énoncé : "Unterricht\nMontag bis Donnerstag: 7:50 bis 15:15\nFreitag: 7:50 bis 12:55"
   - question : Le vendredi, à quelle heure finissent les cours ?
   - lu : Unterricht. Montag bis Donnerstag, sieben Uhr fünfzig bis fünfzehn Uhr fünfzehn. Freitag, sieben Uhr fünfzig bis zwölf Uhr fünfundfünfzig.
   - choix : 12 h 55 · 15 h 15 · 16 h 30
   - réponse : 12 h 55
   - indice : Trouve la ligne Freitag, puis lis l’heure après bis.
   - explication : Freitag : 7:50 bis 12:55, les cours finissent à 12 h 55. En Allemagne, les cours finissent souvent tôt certains jours.

### Niveau 2 · `lv2-4e-daily-life-de-timetable-2`

- consigne : Lis la question, puis trouve la bonne ligne du menu ou du programme en allemand. Le lexique est affiché.

1. énoncé : "Mensa: Speiseplan\nMontag: Nudeln mit Tomatensoße\nDienstag: Hähnchen mit Reis\nMittwoch: Gemüsesuppe"
   - question : Que mange-t-on à la cantine le lundi ?
   - lu : Mensa, Speiseplan. Montag, Nudeln mit Tomatensoße. Dienstag, Hähnchen mit Reis. Mittwoch, Gemüsesuppe.
   - choix : Des pâtes à la sauce tomate · Du poulet avec du riz · Une soupe de légumes
   - réponse : Des pâtes à la sauce tomate
   - indice : Trouve la ligne Montag.
   - explication : Montag = lundi : Nudeln mit Tomatensoße, des pâtes à la sauce tomate. Le poulet (Hähnchen) est le mardi.
   - aide « Einen Speiseplan lesen » :
     - die Mensa = la cantine ; der Speiseplan = le menu
     - die Vorspeise = l’entrée ; das Hauptgericht = le plat principal
     - der Nachtisch = le dessert ; das Getränk = la boisson
     - die Nudeln = les pâtes ; die Kartoffeln = les pommes de terre
     - das Eis = la glace ; die Erdbeere = la fraise ; der Saft = le jus
     - das Mittagessen = le déjeuner
2. énoncé : "Mensa\nMittagessen: 3,50 Euro\nNachtisch: 1 Euro\nGetränk: 0,80 Euro"
   - question : Combien coûte le déjeuner à la cantine ?
   - lu : Mensa. Mittagessen, drei Euro fünfzig. Nachtisch, ein Euro. Getränk, achtzig Cent.
   - choix : 3,50 euros · 1 euro · 0,80 euro
   - réponse : 3,50 euros
   - indice : Le déjeuner se dit das Mittagessen.
   - explication : das Mittagessen = le déjeuner : 3,50 euros. 1 euro, c’est le dessert (Nachtisch) ; 0,80 euro, la boisson.
   - aide « Einen Speiseplan lesen » :
     - die Mensa = la cantine ; der Speiseplan = le menu
     - die Vorspeise = l’entrée ; das Hauptgericht = le plat principal
     - der Nachtisch = le dessert ; das Getränk = la boisson
     - die Nudeln = les pâtes ; die Kartoffeln = les pommes de terre
     - das Eis = la glace ; die Erdbeere = la fraise ; der Saft = le jus
     - das Mittagessen = le déjeuner
3. énoncé : "Nachtisch\nErdbeereis\nSchokoladenpudding\nObstsalat"
   - question : Quelle glace peux-tu prendre ?
   - lu : Nachtisch. Erdbeereis. Schokoladenpudding. Obstsalat.
   - choix : Une glace à la fraise · Une glace au chocolat · Une glace à la framboise
   - réponse : Une glace à la fraise
   - indice : Erdbeereis, c’est deux mots collés : Erdbeere et Eis.
   - explication : Erdbeereis = Erdbeere (fraise) + Eis (glace) : une glace à la fraise. Schokoladenpudding est une crème au chocolat, pas une glace.
   - aide « Einen Speiseplan lesen » :
     - die Mensa = la cantine ; der Speiseplan = le menu
     - die Vorspeise = l’entrée ; das Hauptgericht = le plat principal
     - der Nachtisch = le dessert ; das Getränk = la boisson
     - die Nudeln = les pâtes ; die Kartoffeln = les pommes de terre
     - das Eis = la glace ; die Erdbeere = la fraise ; der Saft = le jus
     - das Mittagessen = le déjeuner
4. énoncé : "Mensa: Donnerstag\nVorspeise: Salat\nHauptgericht: Fisch mit Kartoffeln\nGetränk: Wasser oder Apfelsaft"
   - question : Que peux-tu boire à la cantine ?
   - lu : Mensa, Donnerstag. Vorspeise, Salat. Hauptgericht, Fisch mit Kartoffeln. Getränk, Wasser oder Apfelsaft.
   - choix : De l’eau ou un jus de pomme · Du poisson avec des pommes de terre · Une salade
   - réponse : De l’eau ou un jus de pomme
   - indice : Boire, c’est das Getränk : trouve sa ligne.
   - explication : das Getränk = la boisson : Wasser oder Apfelsaft, de l’eau ou un jus de pomme. Le poisson est le plat principal.
   - aide « Einen Speiseplan lesen » :
     - die Mensa = la cantine ; der Speiseplan = le menu
     - die Vorspeise = l’entrée ; das Hauptgericht = le plat principal
     - der Nachtisch = le dessert ; das Getränk = la boisson
     - die Nudeln = les pâtes ; die Kartoffeln = les pommes de terre
     - das Eis = la glace ; die Erdbeere = la fraise ; der Saft = le jus
     - das Mittagessen = le déjeuner
5. énoncé : "Hallenbad\nMontag bis Freitag: 14:00 bis 21:00\nSamstag: 9:00 bis 13:00\nSonntag: geschlossen"
   - question : Le samedi, à quelle heure ouvre la piscine ?
   - lu : Hallenbad. Montag bis Freitag, vierzehn bis einundzwanzig Uhr. Samstag, neun bis dreizehn Uhr. Sonntag, geschlossen.
   - choix : 9 h 00 · 13 h 00 · 14 h 00
   - réponse : 9 h 00
   - indice : Trouve la ligne Samstag, puis lis la première heure.
   - explication : Samstag = samedi : 9:00 bis 13:00, la piscine ouvre à 9 h et ferme à 13 h. 14 h, c’est du lundi au vendredi.
   - aide « Uhrzeiten lesen » :
     - geschlossen = fermé ; bis = jusqu’à ; die Karte = le billet
     - das Hallenbad = la piscine couverte ; der Sportverein = le club
     - das Abendbrot = le dîner, souvent un repas froid avec du pain
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
6. énoncé : "Kino am Markt\nDie Dracheninsel: 17:30 und 20:00\nKarte: 8 Euro\nDienstag: 5 Euro"
   - question : Quel jour le billet coûte-t-il 5 euros ?
   - lu : Kino am Markt. Die Dracheninsel, siebzehn Uhr dreißig und zwanzig Uhr. Karte, acht Euro. Dienstag, fünf Euro.
   - choix : Le mardi · Le jeudi · Le dimanche
   - réponse : Le mardi
   - indice : Cherche 5 euros, puis lis le début de sa ligne.
   - explication : Dienstag: 5 Euro, le mardi, le billet coûte 5 euros. Les autres jours, die Karte coûte 8 euros. Donnerstag, c’est jeudi.
   - aide « Uhrzeiten lesen » :
     - geschlossen = fermé ; bis = jusqu’à ; die Karte = le billet
     - das Hallenbad = la piscine couverte ; der Sportverein = le club
     - das Abendbrot = le dîner, souvent un repas froid avec du pain
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
7. énoncé : "Sportverein\nFußball: Dienstag und Donnerstag, 18 Uhr\nBasketball: Montag und Mittwoch, 17 Uhr\nSchwimmen: Samstag, 11 Uhr"
   - question : Quels jours y a-t-il du basket ?
   - lu : Sportverein. Fußball, Dienstag und Donnerstag, achtzehn Uhr. Basketball, Montag und Mittwoch, siebzehn Uhr. Schwimmen, Samstag, elf Uhr.
   - choix : Le lundi et le mercredi · Le mardi et le jeudi · Le samedi
   - réponse : Le lundi et le mercredi
   - indice : Trouve la ligne Basketball.
   - explication : Basketball : Montag und Mittwoch, le lundi et le mercredi. Le football, c’est le mardi et le jeudi.
   - aide « Uhrzeiten lesen » :
     - geschlossen = fermé ; bis = jusqu’à ; die Karte = le billet
     - das Hallenbad = la piscine couverte ; der Sportverein = le club
     - das Abendbrot = le dîner, souvent un repas froid avec du pain
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45
8. énoncé : "Bei Familie Weber\nFrühstück: 6:45\nMittagessen: 13:30\nAbendbrot: 18:30"
   - question : À quelle heure la famille Weber dîne-t-elle ?
   - lu : Bei Familie Weber. Frühstück, sechs Uhr fünfundvierzig. Mittagessen, dreizehn Uhr dreißig. Abendbrot, achtzehn Uhr dreißig.
   - choix : 13 h 30 · 18 h 30 · 20 h 00
   - réponse : 18 h 30
   - indice : Le dîner se dit das Abendbrot.
   - explication : das Abendbrot = le dîner : 18 h 30. das Mittagessen, c’est le déjeuner. En Allemagne, on dîne souvent tôt.
   - aide « Uhrzeiten lesen » :
     - geschlossen = fermé ; bis = jusqu’à ; die Karte = le billet
     - das Hallenbad = la piscine couverte ; der Sportverein = le club
     - das Abendbrot = le dîner, souvent un repas froid avec du pain
     - 7:15 = 7 h 15 ; 16:45 = 16 h 45

## Ich esse, ich kann · `de-modals`

- description : L’accusatif (einen, den), puis können, müssen, wollen.
- compétences : c4.de.langue.groupe-nominal · c4.de.langue.lexique
- lv2 : de
- langue : de
- consigne : Lis ou écoute la question en allemand, puis choisis la bonne réponse. La règle est affichée.
- bravo : Bien répondu !
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-de-modals-1`

Pour tous les items :
- aide « Der Akkusativ » :
  - Le COD est à l’accusatif : après essen, haben, nehmen, sehen.
  - Masculin : der devient den, ein devient einen.
  - Féminin (die, eine) et neutre (das, ein) : rien ne change.
  - der Löffel : Ich brauche einen Löffel.
  - Masculins : der Apfel, der Saft, der Bus, der Hund, der Teller
  - Féminins : die Gabel, die Suppe. Neutre : das Stück (le morceau)

1. énoncé : Was isst du?
   - lu : Was isst du?
   - choix : Ich esse einen Apfel. · Ich esse ein Apfel. · Ich esse eine Apfel.
   - réponse : Ich esse einen Apfel.
   - indice : der Apfel est masculin. Que devient ein ?
   - explication : der Apfel (la pomme) est masculin : à l’accusatif, ein devient einen. Ich esse einen Apfel.
2. énoncé : Was trinkst du?
   - lu : Was trinkst du?
   - choix : Ich trinke einen Saft. · Ich trinke ein Saft. · Ich trinke eine Saft.
   - réponse : Ich trinke einen Saft.
   - indice : der Saft est masculin. Que devient ein ?
   - explication : der Saft (le jus) est masculin : ein devient einen. Ich trinke einen Saft.
3. énoncé : Was möchtest du?
   - lu : Was möchtest du?
   - choix : Ich möchte ein Stück Kuchen. · Ich möchte einen Stück Kuchen. · Ich möchte eine Stück Kuchen.
   - réponse : Ich möchte ein Stück Kuchen.
   - indice : das Stück est neutre. Est-ce que ein change ?
   - explication : das Stück (le morceau) est neutre : ein ne change pas. Ich möchte ein Stück Kuchen (un morceau de gâteau).
4. énoncé : Was brauchst du?
   - lu : Was brauchst du?
   - choix : Ich brauche eine Gabel. · Ich brauche einen Gabel. · Ich brauche ein Gabel.
   - réponse : Ich brauche eine Gabel.
   - indice : die Gabel est féminin. Est-ce que eine change ?
   - explication : die Gabel (la fourchette) est féminin : eine ne change pas. Ich brauche eine Gabel.
5. énoncé : Wie fährst du zur Schule?
   - lu : Wie fährst du zur Schule?
   - choix : Ich nehme den Bus. · Ich nehme der Bus. · Ich nehme die Bus.
   - réponse : Ich nehme den Bus.
   - indice : der Bus est masculin. Que devient der ?
   - explication : der Bus est masculin : à l’accusatif, der devient den. Ich nehme den Bus (je prends le bus).
6. énoncé : Hast du ein Haustier?
   - lu : Hast du ein Haustier?
   - choix : Ja, ich habe einen Hund. · Ja, ich habe ein Hund. · Ja, ich habe eine Hund.
   - réponse : Ja, ich habe einen Hund.
   - indice : der Hund est masculin. Que devient ein ?
   - explication : das Haustier (l’animal) est neutre, mais der Hund (le chien) est masculin : ein devient einen. Ja, ich habe einen Hund.
7. énoncé : Was kochst du heute?
   - lu : Was kochst du heute?
   - choix : Ich koche eine Suppe. · Ich koche einen Suppe. · Ich koche ein Suppe.
   - réponse : Ich koche eine Suppe.
   - indice : die Suppe est féminin. Est-ce que eine change ?
   - explication : die Suppe (la soupe) est féminin : eine ne change pas. Ich koche eine Suppe.
8. énoncé : Wo ist der Teller?
   - lu : Wo ist der Teller?
   - choix : Ich sehe den Teller nicht. · Ich sehe der Teller nicht. · Ich sehe das Teller nicht.
   - réponse : Ich sehe den Teller nicht.
   - indice : der Teller est masculin. Que devient der ?
   - explication : der Teller (l’assiette) est masculin : après sehen, der devient den. Ich sehe den Teller nicht (je ne vois pas l’assiette).

### Niveau 2 · `lv2-4e-daily-life-de-modals-2`

- programme : c4.de.langue.modaux-passif

Pour tous les items :
- aide « Können, müssen, wollen » :
  - können = pouvoir, savoir : ich kann, du kannst, er kann
  - müssen = devoir : ich muss, du musst, er muss
  - wollen = vouloir : ich will, du willst, er will
  - Le modal en 2e place ; l’autre verbe, à l’infinitif, à la fin.
  - Ich kann gut malen. (je sais bien dessiner)
  - ich will = je veux : ce n’est pas le futur de l’anglais.
  - Après un modal, la particule reste collée : ich will fernsehen.

1. énoncé : Kannst du schwimmen?
   - lu : Kannst du schwimmen?
   - choix : Ja, ich kann schwimmen. · Ja, ich kann schwimme. · Ja, ich schwimmen kann.
   - réponse : Ja, ich kann schwimmen.
   - indice : Regarde la fin du 2e verbe : -en, l’infinitif, tout à la fin.
   - explication : Ja, ich kann schwimmen = oui, je sais nager. kann en 2e place, schwimmen à l’infinitif, à la fin.
2. énoncé : Kommst du heute Nachmittag?
   - lu : Kommst du heute Nachmittag?
   - choix : Nein, ich muss lernen. · Nein, ich muss lerne. · Nein, ich lernen muss.
   - réponse : Nein, ich muss lernen.
   - indice : Regarde la fin du 2e verbe : -en, l’infinitif, tout à la fin.
   - explication : Nein, ich muss lernen = non, je dois apprendre mes leçons. muss en 2e place, lernen à l’infinitif, à la fin.
3. énoncé : Was willst du am Samstag machen?
   - lu : Was willst du am Samstag machen?
   - choix : Ich will Fußball spielen. · Ich will Fußball spiele. · Ich will spielen Fußball.
   - réponse : Ich will Fußball spielen.
   - indice : Regarde la fin du 2e verbe : -en. Il va tout à la fin, après Fußball.
   - explication : Ich will Fußball spielen = je veux jouer au football. spielen, à l’infinitif, va tout à la fin, après Fußball.
4. énoncé : Kann dein Bruder Gitarre spielen?
   - lu : Kann dein Bruder Gitarre spielen?
   - choix : Ja, er kann Gitarre spielen. · Ja, er kannst Gitarre spielen. · Ja, er kann Gitarre spielt.
   - réponse : Ja, er kann Gitarre spielen.
   - indice : Avec er : kann, sans -st. Le 2e verbe finit par -en.
   - explication : Avec er : er kann, sans -t ni -st. Puis l’infinitif à la fin : ja, er kann Gitarre spielen (il sait jouer de la guitare).
5. énoncé : Musst du dein Zimmer aufräumen?
   - lu : Musst du dein Zimmer aufräumen?
   - choix : Ja, ich muss aufräumen. · Ja, ich muss aufräume. · Ja, ich musst aufräumen.
   - réponse : Ja, ich muss aufräumen.
   - indice : Avec ich : muss, sans -t. Le 2e verbe finit par -en.
   - explication : Avec ich : ich muss. Puis l’infinitif à la fin : ja, ich muss aufräumen (oui, je dois ranger). musst va avec du.
6. énoncé : Will deine Schwester mitspielen?
   - lu : Will deine Schwester mitspielen?
   - choix : Nein, sie will lesen. · Nein, sie willst lesen. · Nein, sie will liest.
   - réponse : Nein, sie will lesen.
   - indice : Avec sie : will, sans -st. Le 2e verbe finit par -en.
   - explication : Avec sie (elle) : sie will. Puis l’infinitif : nein, sie will lesen (non, elle veut lire). willst va avec du.
7. énoncé : Kannst du morgen kommen?
   - lu : Kannst du morgen kommen?
   - choix : Nein, ich kann nicht. · Nein, ich kannst nicht. · Nein, ich können nicht.
   - réponse : Nein, ich kann nicht.
   - indice : Avec ich : kann, sans -st ni -en.
   - explication : Avec ich : ich kann. Nein, ich kann nicht = non, je ne peux pas. kannst va avec du ; können est l’infinitif.
8. énoncé : Muss Paul jetzt aufstehen?
   - lu : Muss Paul jetzt aufstehen?
   - choix : Ja, er muss aufstehen. · Ja, er muss aufsteht. · Ja, er muss steht auf.
   - réponse : Ja, er muss aufstehen.
   - indice : Regarde la fin : aufstehen finit par -en et reste en un seul mot.
   - explication : Ja, er muss aufstehen = oui, il doit se lever. Après muss, aufstehen reste à l’infinitif, en un seul mot, à la fin.

## Schilder · `de-signs`

- description : Des panneaux, des consignes et un petit message ; puis réagir à une proposition ou à un sentiment.
- compétences : c4.de.lire.consignes-panneaux · c4.de.dialoguer.reagir
- lv2 : de
- langue : de
- erreur : {explanation}
- bloc gagné : lv2-4e-daily-life
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `lv2-4e-daily-life-de-signs-1`

- consigne : Lis la question, puis le panneau ou le message en allemand. Pour l’entendre, appuie sur Écouter. Le lexique est affiché.
- programme : c4.de.lire.consignes-panneaux
- bravo : Bien lu !

Pour tous les items :
- langue des choix : fr
- aide « Schilder und Nachrichten » :
  - drücken = pousser ; geöffnet = ouvert ; geschlossen = fermé
  - verboten = interdit ; Achtung = attention
  - der Aufzug = l’ascenseur ; außer Betrieb = en panne
  - der Rasen = la pelouse ; betreten = marcher sur
  - die Hausaufgaben = les devoirs ; die Seite = la page
  - Liebe Mama, lieber Papa = chère maman, cher papa
  - bis später = à plus tard

1. énoncé : Bitte ziehen
   - question : Que faut-il faire pour ouvrir cette porte ?
   - lu : Bitte ziehen.
   - choix : Pousser la porte · Tirer la porte · Sonner à la porte
   - réponse : Tirer la porte
   - indice : Ce n’est pas drücken (pousser) : c’est l’autre geste.
   - explication : ziehen = tirer : Bitte ziehen = tirez, s’il vous plaît. Pousser se dit drücken.
2. énoncé : Rasen betreten verboten!
   - question : Où ne faut-il pas marcher ?
   - lu : Rasen betreten verboten!
   - choix : Sur l’herbe · Sur le trottoir · Dans la cour
   - réponse : Sur l’herbe
   - indice : Regarde le lexique : der Rasen, puis verboten.
   - explication : der Rasen = la pelouse ; verboten = interdit : on ne marche pas sur l’herbe.
3. énoncé : "Aufzug außer Betrieb\nBitte die Treppe benutzen"
   - question : Que dois-tu prendre pour monter ?
   - lu : Aufzug außer Betrieb. Bitte die Treppe benutzen.
   - choix : L’ascenseur · La sortie · L’escalier
   - réponse : L’escalier
   - indice : L’ascenseur (der Aufzug) est en panne. Que reste-t-il pour monter ?
   - explication : der Aufzug = l’ascenseur, außer Betrieb = en panne. die Treppe = l’escalier : bitte die Treppe benutzen = prenez l’escalier.
4. énoncé : "Arbeitet zu zweit!\nLest den Text auf Seite 20."
   - question : Comment faut-il travailler ?
   - lu : Arbeitet zu zweit! Lest den Text auf Seite zwanzig.
   - choix : En groupe de quatre · À deux · Seul
   - réponse : À deux
   - indice : zweit ressemble à un nombre que tu connais.
   - explication : zu zweit = à deux (zwei = 2) : arbeitet zu zweit = travaillez à deux.
5. énoncé : "Hausaufgaben für Montag:\nÜbung 3 auf Seite 45"
   - question : Pour quel jour sont les devoirs ?
   - lu : Hausaufgaben für Montag. Übung drei auf Seite fünfundvierzig.
   - choix : Pour lundi · Pour mardi · Pour jeudi
   - réponse : Pour lundi
   - indice : Lis la 1re ligne : für, puis un jour.
   - explication : für Montag = pour lundi. Mardi se dit Dienstag ; jeudi, Donnerstag.
6. énoncé : Hunde müssen draußen bleiben.
   - question : Que demande ce panneau ?
   - lu : Hunde müssen draußen bleiben.
   - choix : Tenir les chiens en laisse · Donner à boire aux chiens · Laisser les chiens dehors
   - réponse : Laisser les chiens dehors
   - indice : bleiben = rester. Et draußen : dedans ou dehors ?
   - explication : Hunde müssen draußen bleiben = les chiens doivent rester dehors. Ce panneau est souvent sur la porte des magasins.
7. énoncé : "Liebe Mama,\nich bin bei Lukas.\nIch komme um 18 Uhr nach Hause.\nBis später! Tim"
   - question : Où est Tim ?
   - lu : Liebe Mama, ich bin bei Lukas. Ich komme um achtzehn Uhr nach Hause. Bis später! Tim.
   - choix : À la maison · Chez Lukas · À l’école
   - réponse : Chez Lukas
   - indice : bei, puis un prénom : chez quelqu’un.
   - explication : ich bin bei Lukas = je suis chez Lukas. nach Hause = à la maison : Tim y rentre à 18 h.
8. énoncé : "Liebe Oma,\nvielen Dank für das Buch!\nEs ist super spannend.\nKüsse, Lea"
   - question : Pourquoi Lea écrit-elle à sa grand-mère ?
   - lu : Liebe Oma, vielen Dank für das Buch! Es ist super spannend. Küsse, Lea.
   - choix : Pour lui dire bonjour · Pour l’inviter · Pour la remercier
   - réponse : Pour la remercier
   - indice : Lis la 2e ligne : Dank ressemble à danke.
   - explication : vielen Dank = merci beaucoup : Lea remercie sa grand-mère pour le livre. Küsse = bisous.

### Niveau 2 · `lv2-4e-daily-life-de-signs-2`

- consigne : Lis et écoute la phrase en allemand. Choisis la bonne réaction. La règle est affichée.
- programme : c4.de.dialoguer.reagir
- bravo : Bien réagi !

Pour tous les items :
- aide « Reagieren » :
  - Gute Idee! = bonne idée ! ; Toll! = super !
  - Schade! = dommage ! ; Keine Lust! = pas envie !
  - Das tut mir leid. = je suis désolé.
  - Keine Angst! = n’aie pas peur ! ; So ein Pech! = pas de chance !
  - froh = content ; traurig = triste ; sauer = fâché
  - Dire comment on se sent : avec sein (ich bin müde).
  - leider = malheureusement : Leider habe ich keine Zeit.

1. énoncé : Gehen wir am Samstag ins Schwimmbad?
   - lu : Gehen wir am Samstag ins Schwimmbad?
   - choix : Gute Idee! · Gute Besserung! · Keine Angst!
   - réponse : Gute Idee!
   - indice : On te propose une sortie : tu acceptes.
   - explication : Gehen wir ins Schwimmbad? = On va à la piscine ? Gute Idee! = bonne idée ! Gute Besserung! se dit à un malade ; Keine Angst!, à quelqu’un qui a peur.
2. énoncé : Ich habe eine Eins in Mathe!
   - lu : Ich habe eine Eins in Mathe!
   - choix : Schade! · Toll! · Keine Lust!
   - réponse : Toll!
   - indice : die Eins, c’est la meilleure note : une bonne nouvelle.
   - explication : Toll! = super ! On partage sa joie. Schade! veut dire dommage ; Keine Lust!, pas envie. En Allemagne, la meilleure note est souvent 1, die Eins.
3. énoncé : Ich bin traurig. Mein Hund ist krank.
   - lu : Ich bin traurig. Mein Hund ist krank.
   - choix : Das ist super! · Ich freue mich so! · Das tut mir leid.
   - réponse : Das tut mir leid.
   - indice : Ton ami est triste : tu lui montres que ça te fait de la peine.
   - explication : Das tut mir leid = je suis désolé. Das ist super! et Ich freue mich! disent qu’on est content : pas quand un ami est triste.
4. énoncé : Spielst du heute mit uns Fußball?
   - lu : Spielst du heute mit uns Fußball?
   - choix : Leider ich kann nicht. · Leider kann ich nicht. · Leider kann nicht ich.
   - réponse : Leider kann ich nicht.
   - indice : leider est en 1re place. Où va le verbe ?
   - explication : Leider kann ich nicht = malheureusement, je ne peux pas. leider est en 1re place, le verbe kann en 2e, puis ich.
5. énoncé : Ich habe Angst vor dem Test morgen.
   - lu : Ich habe Angst vor dem Test morgen.
   - choix : Keine Angst! · Keine Lust! · Guten Appetit!
   - réponse : Keine Angst!
   - indice : die Angst = la peur. Tu rassures ton ami.
   - explication : Keine Angst! = n’aie pas peur ! Keine Lust! veut dire pas envie ; Guten Appetit!, bon appétit.
6. énoncé : Warum lachst du?
   - lu : Warum lachst du?
   - choix : Ich habe so froh! · Ich bin so sauer! · Ich bin so froh!
   - réponse : Ich bin so froh!
   - indice : lachen = rire. Et pour dire comment on se sent, sein ou haben ?
   - explication : Ich bin so froh! = je suis si content ! On dit comment on se sent avec sein, jamais avec haben. sauer = fâché : on ne rit pas quand on est fâché.
7. énoncé : Ich habe Hunger!
   - lu : Ich habe Hunger!
   - choix : Möchtest du ein Bett? · Möchtest du ein Brot? · Möchtest du ein Buch?
   - réponse : Möchtest du ein Brot?
   - indice : Hunger haben = avoir faim. Que lui proposes-tu ?
   - explication : Möchtest du ein Brot? = tu veux une tartine ? Il a faim : on lui propose à manger. das Bett = le lit ; das Buch = le livre.
8. énoncé : Mein Handy ist kaputt!
   - lu : Mein Handy ist kaputt!
   - choix : Super, ich freue mich! · Toll, gute Idee! · Oh nein, so ein Pech!
   - réponse : Oh nein, so ein Pech!
   - indice : kaputt = cassé : c’est une mauvaise nouvelle.
   - explication : So ein Pech! = pas de chance ! On réagit à une mauvaise nouvelle. Ich freue mich et gute Idee disent qu’on est content.

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `lv2-4e-daily-life-1` | La cuisine de Muscade | 40 | Les murs de ma cuisine ! Merci, bâtisseur. Bientôt, la soupe mijotera ici. |
| `lv2-4e-daily-life-2` | La tonnelle du jardin | 50 | Un toit, une cheminée et une tonnelle ! On mangera dehors, à l’ombre, à toute heure. |
| `lv2-4e-daily-life-3` | La serre du jardin | 60 | Une serre, une barrière, une marche… Mon jardin est complet. À table, bâtisseur ! |
