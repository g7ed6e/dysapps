# Proposer un changement

Pour faire évoluer le game design, on écrit une **fiche de proposition** : un fichier `docs/game-design/propositions/GD-<n>.md` (GD-1, GD-2… ; vérifier que le numéro n’est pas pris), d’une page au plus, qui se lit et se décide seule. Le mainteneur peut aussi la demander en une phrase dans un fil : le fil écrit la fiche.

## Le parcours

1. **La fiche** est écrite sur une branche, avec le modèle ci-dessous.
2. **Les avis**, cités dans la fiche : le directeur artistique toujours (il tranche entre les consultants) ; le consultant de chaque univers touché ; le référent dys toujours ; le directeur contenu pédagogique si la fiche touche ce qu’une mission enseigne ou le rythme des missions ; l’artiste technique 3D si le dessin du monde change.
3. **La décision** du mainteneur, écrite (un mot sur une carte ne suffit pas). Elle s’inscrit dans [les décisions](../decisions.md), la section du [game design](../index.md) qui change est mise à jour, et un lot s’ouvre dans le cadrage qui le construit.
4. **Une fiche écartée reste**, marquée « Écartée », avec son motif : on ne rediscute pas deux fois la même chose.

## Le modèle

```md
# GD-<n> : <le changement, en quelques mots>

**État** : Proposée | Décidée le <date> | Écartée le <date> (<motif>)
**Portée** : Commun | Blocland | Archipéo

## Le constat
Ce qui amène la proposition : un retour d’élève ou d’adulte, un écart avec la cible, une idée.

## La proposition
Ce que l’élève verrait et ferait. Deux options au plus, avec la recommandation.

## Ce qui ne bouge pas
Les règles en jeu (DP, DA, principes dys, §4 de Plusieurs univers) ; sauvegarde, identifiants, progression.

## Le coût
Taille, lot, fichiers touchés, sauvegarde touchée ou non.

## Les avis
- Directeur artistique : …
- Consultant(s) : …
- Référent dys : …
- (Directeur contenu pédagogique, artiste technique 3D : si concernés)

## La décision
<date>, mainteneur : …
```
