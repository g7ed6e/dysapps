# Le référentiel des programmes

Chaque mission de Blocland et du portail cite les compétences du programme officiel qu’elle travaille. Le référentiel qui les décrit est dans `src/programme/` ; la page [Programmes officiels](https://g7ed6e.github.io/dysapps/pedagogie/programmes.html) en est produite à chaque build, avec la couverture. Cette page dit d’où vient le référentiel, comment il est fait, et comment l’étendre à une autre matière ou à un autre cycle.

## Ce qu’il contient

```
src/programme/
  types.ts         les types : cycle, discipline, source, domaine, compétence, exclusion
  sources.ts       la provenance : jeu de données data.gouv.fr, PDF, licence, arrêté, date de consultation
  cycle3.ts        le cycle 3 (6e) : domaines et compétences, français, maths, anglais
  cycle4.ts        le cycle 4 (5e, 4e, 3e) : domaines et compétences, français, maths, anglais, allemand et espagnol (LV2)
  exclusions.ts    les compétences sans mission, avec leur motif
  motsOutils.ts    la liste officielle des mots-outils (CP, CE1), citée pour le Coffre à mots
  index.ts         PROGRAMME, DOMAINES, DISCIPLINES, CYCLE_OF, byId, entriesOf ; le type ProgrammeId
  programme.test.ts
```

Une **compétence** (`ProgrammeEntry`) est une ligne du programme au grain d’une mission : un identifiant stable `c<cycle>.<fr|ma|en|de|es>.<domaine>.<compétence>`, le cycle, la discipline, le domaine, l’attendu de fin de cycle, la connaissance ou compétence associée, et la page du PDF. Les libellés sont des résumés fidèles du texte officiel, courts, sans apostrophe droite ni barre verticale (ils vont dans des tableaux) ; le texte fait foi.

Une **mission** cite ses compétences dans le champ `compétences` de sa section dans `docs/contenu/<île>.md` (obligatoire, au moins une ; produit en `programme` dans `src/blocland/iles.ts`) ou de `src/apps/registry.ts` (portail). Un exercice peut préciser les siennes (`programme` d’un niveau, dans le même fichier) quand ses niveaux ne travaillent pas la même chose. Le type `ProgrammeId` est l’union des identifiants du référentiel : `tsc` refuse un identifiant inconnu, pour le portail comme pour les îles (`src/blocland/iles.ts`, produit par `npm run contenu`, est vérifié par `satisfies BiomeDef[]`).

Une **exclusion** (`exclusions.ts`) dit pourquoi une compétence n’a pas de mission : `hors-perimetre` (durable : l’oral, l’écriture libre, la lecture d’œuvres complètes, la géométrie de construction) ou `a-couvrir` (la dette de contenu, visible sur la page Programmes officiels). Le test de couverture (`src/blocland/programme.test.ts`) exige que chaque compétence soit travaillée ou exclue, jamais les deux : une pull request qui couvre une compétence retire son exclusion, et une compétence qui perd sa mission reçoit une exclusion motivée. La couverture ne régresse pas en silence.

Rien de tout cela n’est embarqué dans l’application : les missions n’importent que des types. Le référentiel sert aux tests et au générateur de documentation.

## D’où il vient

| Source | Ce qu’on y trouve | Licence |
| --- | --- | --- |
| [Programmes d’enseignement de l’école élémentaire et du collège : cycles 2, 3 et 4](https://www.data.gouv.fr/datasets/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/) (ministère de l’Éducation nationale, data.gouv.fr) | Trois PDF, un par cycle (arrêté du 17 juillet 2020) : toutes les disciplines du cycle. Cycle 3 : français p. 9, langues vivantes p. 32, mathématiques p. 89. Cycle 4 : français p. 11, langues vivantes p. 35, mathématiques p. 126. | Licence Ouverte 2.0 : réutilisation libre, avec mention de la source et de la date |
| [Mots outils CE1](https://www.data.gouv.fr/datasets/mots-outils-ce1/) (data.gouv.fr) | La liste indicative des mots-outils de fin de CP et des mots invariables fréquents de fin de CE1 (BO n° 0 du 20 février 2008) | Licence Ouverte |

Ce que data.gouv.fr **ne** fournit **pas** : un lexique scolaire, une liste de fréquence, les déclinaisons par langue du programme de langues vivantes (elles sont sur Éduscol), les programmes par année. Les évaluations nationales Repères (CP à CM2) nomment des compétences mais seulement pour l’école ; celles de 6e et de 4e ne donnent que des scores. Le programme du cycle 4 ne répartit rien entre la 5e, la 4e et la 3e : seule la frontière entre les cycles 3 et 4 est un écart au programme.

## Ajouter une matière ou un cycle

1. **Trouver la source.** Chercher sur data.gouv.fr avec l’API (`https://www.data.gouv.fr/api/1/datasets/?q=programme%20d%27enseignement`) ou le site ; vérifier l’éditeur (le ministère), la licence (Licence Ouverte) et la date. Pour une discipline du collège, les trois PDF ci-dessus suffisent ; pour un autre niveau, chercher la fiche du programme correspondant.
2. **Extraire le texte.** `npm run programme:extract -- c3` (ou `c4`, ou l’URL d’un autre PDF) télécharge le PDF déclaré dans `sources.ts`, écrit `.programme/<id>.txt` (le texte, une marque `===== PAGE n =====` par page) et `.programme/<id>.toc.txt` (les titres repérés avec leur page), et affiche ce sommaire. Le dossier `.programme/` est ignoré par git.
3. **Repérer les pages.** Dans le sommaire, noter où commence la discipline, puis chercher dans le texte « Attendus de fin de cycle », « Connaissances et compétences associées », « Repères de progressivité », « Terminologie », et pour les langues « Niveau A1 », « Niveau A2 ».
4. **Rédiger les compétences.** Une compétence par chose qu’une mission peut travailler : ni l’attendu entier, ni chaque puce du PDF ; de 20 à 35 par discipline et par cycle. Déclarer d’abord les domaines (`DOMAINES_C3`, `DOMAINES_C4` : identifiant `c<cycle>-<abréviation>-<domaine>`, titre officiel, page), puis les compétences avec leur attendu, leur libellé et leur page. Prévoir une compétence « témoin » par domaine que l’application ne peut pas travailler (l’oral, l’écriture libre) : la page de couverture dit ainsi ce que l’application ne fait pas.
5. **Déclarer la discipline.** Une nouvelle matière est d’abord une matière de l’application : `Subject` dans `src/apps/registry.ts`, puis `DISCIPLINES` dans `src/programme/index.ts` (libellé, abréviation des identifiants). Une discipline peut entrer au référentiel avant d’avoir une île : elle s’ajoute alors à `Discipline` dans `src/programme/types.ts` (`Subject | 'allemand' | 'espagnol'`) et devient une matière de l’application avec sa première île, comme l’allemand et l’espagnol (LV2). Une discipline qui n’existe que dans un cycle (la LV2 commence en 5e) se déclare dans `programme.test.ts`, qui sinon l’attend dans les deux. Un nouveau PDF se déclare dans `SOURCES`.
6. **Exclure ce qui n’a pas de mission.** Lancer `npm test` : le test de couverture nomme chaque compétence sans mission ; l’ajouter à `exclusions.ts`, `a-couvrir` avec ce qui est prévu, ou `hors-perimetre` avec la raison.
7. **Rattacher les missions.** Le champ `programme` des missions concernées ; une île de 6e ne cite que le cycle 3, une île de 5e à 3e cite au moins une compétence du cycle 4 et peut consolider le cycle 3. Retirer les exclusions des compétences désormais couvertes.
8. **Vérifier et relire.** `npm test`, `npm run www:build`, puis relire `dist-www/pedagogie/programmes/` et les pages des îles touchées (`npm run www:preview`). La page se génère seule ; il reste le fragment de journal.

## Ce que l’analyse d’origine a établi

Le référentiel a été écrit le 27 septembre 2026 à partir des PDF des cycles 3 et 4, pour le français, les mathématiques et les langues vivantes (portées par la matière Anglais). Les 79 missions des 28 îles et les 7 missions du portail ont été rattachées ; les compétences sans mission sont listées dans `exclusions.ts` avec ce qui est prévu pour chacune (nouvelles missions, nouvelle île de grandeurs et mesures en 6e). Le [cadrage du contenu](cadrage-contenu.md) reprend ces suites.

Le 28 septembre 2026, l’allemand et l’espagnol y sont entrés en deuxième langue vivante (LV2), au cycle 4 seulement : le programme de langues vivantes est commun à toutes les langues, et leurs 20 compétences (`c4.de.*`, `c4.es.*`) recopient celles de l’anglais, avec les mêmes libellés et les mêmes pages. Les pages n’ont pas pu être vérifiées à nouveau dans le PDF ce jour-là (téléchargement refusé depuis l’environnement de travail) : ce sont celles de l’anglais, relues lors de l’analyse d’origine. Toutes sont exclues en attendant les îles LV2 (étapes LV2-2 à LV2-5 du [cadrage du contenu](cadrage-contenu.md)) ; LV2-2, le Relais des voyageurs, en couvre une partie.
