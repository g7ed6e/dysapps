---
name: captures
description: Prendre vite les captures d'écran de DysApps (manuel en local, lots de rendu Archipéo et Blocland sur la CI), les comparer à main et ne publier que ce qui change sur la branche captures. À lire avant toute capture.
---

# Les captures d'écran, vite

Les captures sont souvent l'étape la plus longue d'un fil. Ce qui suit évite de refaire ce qui n'a pas changé, d'attendre pour rien et de faire relire des images identiques (décision du mainteneur, 1er octobre 2026, sur l'avis du directeur artistique).

## Quel script

- **Le manuel** (`www/_captures/`, jamais commitées) : `npm run www:captures -- <nom> [<nom>…]`, les noms de `SHOTS` dans `scripts/www/captures.mjs`. Ne refaire que les écrans qui changent ; la CI refait tout sur `main`.
- **Un lot de rendu** : le workflow « Captures d'un lot » sur la CI, qui lance `npm run rendu:mesures` (les captures déclarées dans `CAPTURES` de `scripts/rendu/mesures.mjs`) sur plusieurs machines. Le déroulé, et la commande en local : « Un lot de rendu, pas à pas » ci-dessous.
  - Toujours `--sans-poids` sauf si le poids de Three.js est demandé : il lance un build complet.
  - Familles : le socle (`jour`, `nuit`), refait par la CI à chaque publication sur main ; `personnages` et `lisibilite` (grand texte, test en gris des créatures), communes ; et celles des lots en cours. Un lot qui a besoin d'une vue de plus ajoute sa famille dans `CAPTURES` (jamais un script à côté), et la retire de la liste une fois fusionné.
  - Les trois vues de jour (les mesures) se font toujours.

## Pièges connus

- Lancer depuis le dépôt principal, pas depuis un worktree : dans un worktree, les polices ne sont pas servies et les textes changent de forme.
- Rendu logiciel (SwiftShader, pas de carte graphique) : la page demanderait 60 images/s que le processus graphique ne peut pas dessiner (il occupe les quatre cœurs), et chaque prise attendait 11 à 18 s que les images en retard se vident. Les deux scripts passent par `scripts/prise-de-vue.mjs`, qui bride la boucle de rendu à 8 images/s et la fige le temps de la prise. Une nouvelle prise d'image passe par `capturer(page, …)`, jamais par `page.screenshot` directement, et la page reçoit `page.addInitScript(figeable)` avant de charger l'application.
- Les captures de rendu (`rendu:mesures`) pilotent l'horloge de la page (`piloterLHorloge`, `preparerLaScene`) : elle n'avance que pas à pas, jusqu'au monde construit puis d'un nombre fixe de pas, et le hasard part d'une graine fixe (`hasardFixe`). Deux prises du même état donnent la même image (au plus 0,3 % de pixels différents, contre 1 à 2 % avant), animations comprises : une capture d'avant et une d'après ne diffèrent que par ce que le lot change. La caméra est posée d'un coup à son cadrage (`Camera.poser`). Pas d'attente fixe avant une capture 3D. Le 6e de jour et de nuit (six vues) : 35 s, contre 149 s avant le 01/10/2026 ; avec les personnages (19 vues) : 66 s.
- Un défi tirait parfois ses questions dans un autre ordre d'une prise à l'autre (la Ferme, le Soleil de cuivre, la Baie des mots) : en développement, l'effet du défi se lance deux fois, et les deux tirages se partageaient la suite du hasard selon l'ordre où leurs exercices arrivaient. Depuis HG-2 (6 octobre 2026), `bossDef` tire sa graine d'un coup, avant le chargement : le même défi à chaque prise. Une planche de défi qui change encore sans raison se dit dans la pull request plutôt que de la faire relire.
- Le manuel (`www:captures`) garde l'heure figée et ses attentes (les gestes ont besoin des minuteries) ; `attendreLaScene` y pose la caméra avant chaque capture d'un écran 3D.
- Les images par seconde affichées par les mesures en rendu logiciel varient beaucoup d'une fois à l'autre : ne pas en tirer de conclusion. Elles se mesurent sur la tablette de référence (`/?mesures#/aventure`).
- Heure figée ou pilotée (`page.clock`) : pas de `waitForFunction` qui sonde, utiliser des attentes (`waitForTimeout`) ou `page.evaluate`.
- Lancer un long script en arrière-plan avec un journal (`> fichier.log 2>&1`), pas derrière `| tail` : sinon rien ne s'affiche avant la fin.
- Un seul script de captures à la fois dans le conteneur : deux en parallèle se disputent les 4 cœurs et vont moins vite.

## Ce qu'un lot de rendu montre

Jour et nuit, en 3D (`docs/univers/archipeo/cadrage.md`, `docs/conception/bonnes-pratiques-dys.md`). Ni 2D, ni Contraste élevé, ni « Réduire les animations » : ces captures sont retirées le 28 septembre 2026 (les deux réglages reviennent au lot 11 du cadrage Archipéo, avec leurs captures). Le référent dys demande en plus une courte vidéo sur tablette, que seul le mainteneur peut faire : la noter comme restant à faire.

Le périmètre par défaut d'un lot :

- **L'univers** : tout dans l'univers où le lot est conçu (Archipéo pour la migration), et une vue témoin dans l'autre (l'île et l'archipel de jour). Les deux en entier si le changement prend une forme propre à chaque univers (comme GD-3).
- **L'archipel** touché seulement (`--archipel`), dont toujours sa vue de l'archipel de jour, pour juger de loin.
- **La nuit** si le lot touche la lumière, les couleurs ou les lueurs, ou s'il ajoute ou change une construction visible (ses fenêtres se jugent de nuit).
- **Le téléphone et le grand texte** (`lisibilite`, les familles qui ont des vues 390 × 844 ou 800 × 1280) si le lot touche l'interface, le cadrage ou la taille d'une île.
- **Les personnages** si le lot touche une créature ou un Gardien.

## Qui fait quoi (décision du mainteneur, 1er octobre 2026)

- **L'artiste technique 3D code, commite et s'arrête.** Il ne lance pas les captures d'un lot et ne les attend pas : c'est le fil qui l'a missionné qui lance le workflow et qui reprend à sa fin. Une attente active de plusieurs minutes par un agent au long contexte coûte cher et n'avance rien (constat du 01/10 : 330 000 tokens réécrits à chaque réveil).
- **Une retouche, un artiste neuf.** Après la relecture des planches, le fil lance un nouvel artiste avec un brief court (ce qui change, le lien des planches, le commit de départ), plutôt que de relancer le même agent avec tout l'historique du lot.
- **Pas de captures finales quand une pull request qui passe avant va fusionner** (ordre de fusion, CI verte, mot du mainteneur donné) : le merge-base serait dépassé et tout serait à refaire. Attendre sa fusion, se remettre sur main, puis lancer.
- **Les relecteurs lisent un commit figé.** Le fil donne à l'expert frontend et aux autres relecteurs un commit poussé ou commité, et ne remet pas la branche sur main ni ne fait retoucher pendant leur relecture. Un relecteur ne lance ni captures ni `rendu:mesures`.
- **Les triangles** se comptent avec `npm run rendu:budget` (poste par poste, enveloppe et marge, sans navigateur), jamais avec un test jetable.

## Un lot de rendu, pas à pas

Les captures d'un lot se font sur la CI, pas dans le conteneur du fil (décision du mainteneur, 1er octobre 2026) : une machine par univers, archipel et côté (avant, après), en parallèle (`.github/workflows/captures-lot.yml`).

1. **La branche à jour avec main** (`git fetch origin main && git rebase origin/main`), poussée : sinon un lot voisin fusionné entre-temps ressort comme un changement, et le workflow n'est pas sur la branche.
2. **Lancer le workflow « Captures d'un lot »** sur la branche du lot (outil GitHub `actions_run_trigger`, méthode `run_workflow`, `workflow_id` `captures-lot.yml`, `ref` la branche), avec :
   - `lot` : le dossier sur la branche `captures` (minuscules, chiffres, tirets : `r5`, `gd-3`) ;
   - `familles` : celles du périmètre (`jour,nuit,lieux-salle`) ; les vues de jour se font toujours ;
   - `archipels` : l'archipel touché (`6e`), ou plusieurs (`6e,3e`) ;
   - `univers` : `blocland`, `archipeo` ou `les-deux`.
   - `contre` : `main` (par défaut) ou `preview` pour un lot qui part de `preview` : l'avant se prend alors sur leur ancêtre commun avec `preview`, sinon les lots de `preview` pas encore sur main ressortent comme des changements.
   L'avant se prend sur le commit de main dont la branche part (merge-base), l'après sur la branche : rien à préparer, pas de `captures-main` à lire. Relancer sur la même branche annule le passage en cours.
3. **Attendre la fin** (`actions_list`, `list_workflow_runs` sur `captures-lot.yml` et la branche) : deux à trois minutes pour un archipel (2 min 20 mesurées, le 6e de jour), à peine plus pour quatre : les machines travaillent en même temps. Une machine en erreur arrête tout le passage (ni comparaison, ni publication) : lire le journal du job **prendre** en échec, corriger, relancer.
4. **Lire le résultat** : `git fetch origin captures`, puis `<lot>/<univers>/` : les planches avant/après des seules vues changées (au-delà de 0,3 % de pixels différents) et des vues nouvelles, et `comparaison.md` (les vues inchangées, avec leur écart). Le résumé du passage reprend `comparaison.md`.
5. **La relecture** : le directeur artistique et les consultants ne relisent que les planches et `comparaison.md`. Un écart inattendu dans une vue que le lot ne devait pas toucher se dit dans la pull request ; un nouveau passage remplace le dossier de l'univers.

**En local, si la CI n'est pas joignable** : l'avant du socle est sur la branche `captures-main` (`.github/workflows/references.yml`, un dossier par commit de main, les cinq derniers), le reste se prend sur le commit de départ.

```sh
git fetch origin captures-main
git worktree add ../references origin/captures-main   # des images seulement : un worktree suffit
base=$(git merge-base HEAD origin/main)
cp -r ../references/$base/blocland /tmp/avant-blocland    # si le dossier manque : la CI de ce commit tourne encore, ou il est trop ancien
git stash -u && git checkout $base
npm run rendu:mesures -- --sans-poids --captures /tmp/avant-blocland --archipel 6e --familles lieux-salle   # l'avant des vues hors socle
git checkout - && git stash pop
npm run rendu:mesures -- --sans-poids --captures /tmp/apres-blocland --comparer /tmp/avant-blocland --archipel 6e --familles jour,nuit,lieux-salle
```

## Publier sur la branche `captures`

Branche à part, jamais fusionnée, un dossier par lot (`r5/`, `r4b-4e/`…). Seules les planches des vues changées et `comparaison.md` y vont ; les vues inchangées ne se publient pas. Le workflow « Captures d'un lot » les y range lui-même ; à la main, seulement pour des captures prises en local :

```sh
git fetch origin captures
git worktree add ../captures origin/captures   # un worktree suffit ici : on n'y lance pas l'application
cd ../captures && git switch -c captures-maj
mkdir -p <lot>/blocland && cp /tmp/apres-blocland/planches/*.jpg /tmp/apres-blocland/comparaison.md <lot>/blocland/
git add <lot> && git commit -m "Captures du lot <lot> : <ce qu'elles montrent>"
git push origin HEAD:captures
```

Dans la description de la pull request, lier le dossier : `https://github.com/g7ed6e/dysapps/tree/captures/<lot>`.
