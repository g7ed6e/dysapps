# Lot 16, retouche 1 : captures v2 (commit 2d6acd57)

Prises sur le code commité, par `captures16.mjs` (+ `lib.mjs`), Chromium de /opt/pw-browsers, horloge maîtrisée.

## La ligne sombre
Dans `05-ruine-trois-quarts`, ce n'était pas un câble : c'était le demi-pan de toit restant de la ruine, vu par la tranche, qui partait du haut vers le nord-ouest. Il est maintenant affaissé (`ROOF_FALL`) et reste dans le lieu ; test : point le plus haut du bois usé entre 4 et 5,6. `reach` (câbles) ne rend rien tant que rien n'est posé (test), et la scénette ne filtre plus les câbles dans ses rayons de caméra.

## Avant / après
- 01-ruine-de-face : la ligne sombre a disparu ; dalles de la cour plus claires (ne se lisent plus comme des trous) ; poulie de sol à pans et jante, lanterne de la câbliste à droite.
- 04-restaure-de-face : bande de racines vert-de-gris avec ondes sur la poutre ; piton gris à pans ; trou agrandi, goujons clairs, corde de la lanterne raccourcie ; poulies à 10 pans avec jante ; mât sans pointe ; nacelles à deux tons de paille, plus larges et plus basses, quatre cordes ; câbles gris fer.
- 05-ruine-trois-quarts : plus de ligne sombre sortant du mât.
- 05-restaure-de-dos : mêmes pièces vues de dos, câbles gris fer.
- 07-perchoir-arrivee : caméra moins plongeante, horizon vers le tiers haut, mur de nuages dans le cadre ; muret à dessus clair ; sente brune continue à liseré sombre.
- 07-perchoir-vu-du-chemin : muret et sente lisibles.
- 09-cables-de-loin : câbles gris fer, lus comme du fer et non de la corde (vue reculée P(0,8,62), fov 84).
- 08-carte-restaure : l'étiquette n'a pas bougé, non refaite.

## Moufles (scène des réponses)
### 1024x768 (moufles-1024x768.json)
Cibles : réponses `fonction`, `solution technique`, `contrainte` : 320x180 chacune (bouton DOM, moufle et étiquette ensemble), à 18 px du bord gauche et 22 px du droit ; bord bas à 89 px de la fenêtre. Boutons d'écoute : 48x48. « Un indice » 218x59, « Vue simple » 216x56, Pause 56x56 (12 px du bord haut et du bord droit : écart commun aux lots, hors retouche). Marge de 16 px : tenue partout sauf Pause (12) et la réponse de gauche/droite (18/22, tenue).

### 390x844, OpenDyslexic 32
Vue simple (moufles-390x844.json) : réponses `contrainte` 266x48, `solution technique` 308x81, `norme` 175x48 ; 41 px du bord gauche, 48 px de haut minimum. Lire la phrase 48x48, Lire la suite 56x48, Pause 56x56 à 19 px.
Vue Scène (moufles-390x844-scene.json) : le panneau d'offre couvre la scène ; les réponses n'y sont pas affichées (taille 0x0) ; seule la vue simple les offre. À signaler au consultant UX UI : en OpenDyslexic 32 la scène des moufles n'est pas jouable telle quelle, il faut passer par la vue simple.
Les boutons de réponse mesurent 48 px dans le DOM (environ 45 à l'œil, déjà noté hors retouche).

## Non fait
- Poulies au sommet du mât (le DA ne demandait que d'ôter la pointe).
- Lanterne de la halle : le pied ne peut atteindre 4,1 (bas de la poutre 4,475) ; lanterne réduite et trou abaissé à y 2,7.
- Lanterne de la câbliste à x 7,1 hors du cadre de la scénette.
- Joints décalés de la cour de la ruine (couleurs et inclinaison à la place).
