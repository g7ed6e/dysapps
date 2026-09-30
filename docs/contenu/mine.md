---
île : mine
module : Confusions de lettres
matière : francais
classe : 6e
description : b/d, p/q, f/v, ch/j, t/d : ne plus les confondre.
bloc : pierre
gardien : le Golem de roche
icône : pickaxe
créature : Tunel
---

# Mine des lettres

## Filon · `filon`

- description : Pioche seulement la lettre cible parmi b, d, p, q.
- compétences : c3.fr.langue.phonemes-graphemes
- bravo : Bien piochée !
- erreur : C’était un {letter}, pas un {target} : {tip}.
- bloc gagné : pierre
- blocs : 4
- monte à : 0.9
- descend à : 0.5

### Niveau 1 · `mine-filon-b`

- cible : b
- consigne : Pioche seulement les blocs avec la lettre b. Laisse passer les autres.
- XP : 12

Pour tous les items :
- astuce : le ventre du b est à droite, la barre monte

| clé | lettre | juste |
| --- | --- | --- |
| 0-d | d | non |
| 1-b | b | oui |
| 2-q | q | non |
| 3-b | b | oui |
| 4-d | d | non |
| 5-p | p | non |
| 6-d | d | non |
| 7-b | b | oui |
| 8-b | b | oui |
| 9-b | b | oui |
| 10-b | b | oui |
| 11-p | p | non |

### Niveau 1 · `mine-filon-d`

- cible : d
- consigne : Pioche seulement les blocs avec la lettre d. Laisse passer les autres.
- XP : 12

Pour tous les items :
- astuce : le ventre du d est à gauche, la barre monte

| clé | lettre | juste |
| --- | --- | --- |
| 0-d | d | oui |
| 1-d | d | oui |
| 2-b | b | non |
| 3-d | d | oui |
| 4-q | q | non |
| 5-d | d | oui |
| 6-p | p | non |
| 7-b | b | non |
| 8-d | d | oui |
| 9-b | b | non |
| 10-q | q | non |
| 11-d | d | oui |

### Niveau 1 · `mine-filon-mix-1`

- cible : b, d, p ou q
- consigne : À chaque bloc, la lettre à piocher change : lis-la, pioche seulement si le bloc la porte. Laisse passer les autres.
- XP : 14

| clé | lettre | cible | juste | astuce |
| --- | --- | --- | --- | --- |
| 0-b-b | b | b | oui | le ventre du b est à droite, la barre monte |
| 1-p-b | b | p | non | le ventre du p est à droite, la barre descend |
| 2-d-d | d | d | oui | le ventre du d est à gauche, la barre monte |
| 3-q-p | p | q | non | le ventre du q est à gauche, la barre descend |
| 4-p-p | p | p | oui | le ventre du p est à droite, la barre descend |
| 5-b-d | d | b | non | le ventre du b est à droite, la barre monte |
| 6-q-q | q | q | oui | le ventre du q est à gauche, la barre descend |
| 7-b-p | p | b | non | le ventre du b est à droite, la barre monte |
| 8-b-b | b | b | oui | le ventre du b est à droite, la barre monte |
| 9-b-q | q | b | non | le ventre du b est à droite, la barre monte |
| 10-d-d | d | d | oui | le ventre du d est à gauche, la barre monte |
| 11-d-b | b | d | non | le ventre du d est à gauche, la barre monte |

### Niveau 2 · `mine-filon-mix-2`

- cible : b, d, p ou q
- consigne : À chaque bloc, la lettre à piocher change : lis-la, pioche seulement si le bloc la porte. Laisse passer les autres.
- XP : 14

| clé | lettre | cible | juste | astuce |
| --- | --- | --- | --- | --- |
| 0-b-b | b | b | oui | le ventre du b est à droite, la barre monte |
| 1-q-p | p | q | non | le ventre du q est à gauche, la barre descend |
| 2-d-d | d | d | oui | le ventre du d est à gauche, la barre monte |
| 3-q-d | d | q | non | le ventre du q est à gauche, la barre descend |
| 4-p-p | p | p | oui | le ventre du p est à droite, la barre descend |
| 5-d-b | b | d | non | le ventre du d est à gauche, la barre monte |
| 6-q-q | q | q | oui | le ventre du q est à gauche, la barre descend |
| 7-q-p | p | q | non | le ventre du q est à gauche, la barre descend |
| 8-b-b | b | b | oui | le ventre du b est à droite, la barre monte |
| 9-d-b | b | d | non | le ventre du d est à gauche, la barre monte |
| 10-d-d | d | d | oui | le ventre du d est à gauche, la barre monte |
| 11-q-d | d | q | non | le ventre du q est à gauche, la barre descend |
| 12-p-p | p | p | oui | le ventre du p est à droite, la barre descend |
| 13-d-b | b | d | non | le ventre du d est à gauche, la barre monte |
| 14-q-q | q | q | oui | le ventre du q est à gauche, la barre descend |
| 15-b-q | q | b | non | le ventre du b est à droite, la barre monte |

### Niveau 1 · `mine-filon-p`

- cible : p
- consigne : Pioche seulement les blocs avec la lettre p. Laisse passer les autres.
- XP : 12

Pour tous les items :
- astuce : le ventre du p est à droite, la barre descend

| clé | lettre | juste |
| --- | --- | --- |
| 0-q | q | non |
| 1-b | b | non |
| 2-q | q | non |
| 3-q | q | non |
| 4-b | b | non |
| 5-p | p | oui |
| 6-p | p | oui |
| 7-p | p | oui |
| 8-p | p | oui |
| 9-p | p | oui |
| 10-p | p | oui |
| 11-d | d | non |

### Niveau 1 · `mine-filon-q`

- cible : q
- consigne : Pioche seulement les blocs avec la lettre q. Laisse passer les autres.
- XP : 12

Pour tous les items :
- astuce : le ventre du q est à gauche, la barre descend

| clé | lettre | juste |
| --- | --- | --- |
| 0-d | d | non |
| 1-p | p | non |
| 2-q | q | oui |
| 3-q | q | oui |
| 4-d | d | non |
| 5-q | q | oui |
| 6-d | d | non |
| 7-q | q | oui |
| 8-q | q | oui |
| 9-q | q | oui |
| 10-p | p | non |
| 11-d | d | non |

## Oreille du mineur · `oreille`

- description : Écoute le mot, choisis le bon bloc : vin ou fin ?
- compétences : c3.fr.langue.phonemes-graphemes
- par partie : 6
- bravo : Bonne oreille !
- erreur : Tu as choisi {chosen}. C’était {word} : {hint}
- bloc gagné : pierre
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `mine-oreille-1`

- consigne : Écoute bien le mot, puis choisis le bloc qui est écrit comme tu entends.
- blocs : 3
- XP : 10

| phrase | mot | choix | réponse | indice |
| --- | --- | --- | --- | --- |
| Un verre de vin. | vin | vin · fin | vin | le v vibre dans la gorge, comme dans vélo. |
| La poule pond un œuf. | poule | poule · boule | poule | le p souffle sans vibrer, comme dans papa. |
| Je prends un bain. | bain | bain · pain | bain | le b vibre, comme dans bébé. |
| Une dent qui bouge. | dent | dent · temps | dent | le d vibre, comme dans doigt. |
| Un gâteau au chocolat. | gâteau | gâteau · cadeau | gâteau | le g vibre, comme dans gomme. |
| Un chou vert. | chou | chou · joue | chou | le ch souffle sans vibrer, comme dans chat. |
| Un banc dans le parc. | banc | banc · panc | banc | le b vibre dans la gorge, comme dans bateau. |
| Un fil de laine. | fil | fil · vil | fil | le f souffle sans vibrer, comme dans feu. |
| Un tas de sable. | tas | tas · das | tas | le t claque sans vibrer, comme dans table. |
| Une bulle de savon. | bulle | bulle · pulle | bulle | le b vibre dans la gorge, comme dans ballon. |

### Niveau 2 · `mine-oreille-2`

- consigne : Écoute bien le mot dans sa phrase, puis choisis le bloc qui est écrit comme tu entends.
- blocs : 4
- XP : 12

| phrase | mot | choix | réponse | indice |
| --- | --- | --- | --- | --- |
| Une poire bien mûre. | poire | poire · boire | poire | le p souffle sans vibrer, comme dans papa. |
| On va goûter à quatre heures. | goûter | goûter · coûter | goûter | le g vibre, comme dans gomme. |
| Le chaton est doux. | doux | doux · tout | doux | le d vibre, comme dans doigt. |
| Elle a une joue rouge. | joue | joue · chou | joue | le j vibre, comme dans jardin. |
| Une grande ville. | ville | ville · fille | ville | le v vibre, comme dans vélo. |
| Le train entre en gare. | gare | gare · car | gare | le g vibre, comme dans gomme. |
| Un oiseau dans sa cage. | cage | cage · cache | cage | le j de cage vibre, comme dans girafe. |
| La vache broute. | vache | vache · fache | vache | le v vibre dans la gorge, comme dans vélo. |
| Ouvre la bouche. | bouche | bouche · pouche | bouche | le b vibre dans la gorge, comme dans bateau. |
| Une jupe rouge. | jupe | jupe · chupe | jupe | le j vibre, comme dans jouet. |

## Les plans

| plan | nom | XP | coffre | quand c’est bâti |
| --- | --- | --- | --- | --- |
| `mine-forge` | La forge de Tunel | 50 | sable × 3 | Une vraie forge ! Avec la poutre en bois, elle tiendra cent ans. Tu as l’œil, bâtisseur. |
| `mine-toit` | Le toit de la forge | 60 |  | Le toit est posé, la porte aussi. Dedans, il fait chaud comme au fond de la mine. |
| `mine-cour` | La cour de la forge | 70 | or × 2 · cristal × 2 | Ma forge a sa cour. Les lettres qui se ressemblent n’ont qu’à bien se tenir. |
