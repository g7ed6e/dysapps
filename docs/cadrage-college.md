# Cadrage — Blocland jusqu'à la fin de 3e

Document de travail (25 septembre 2026). Objectif : prolonger l'archipel pour couvrir les programmes de français et de maths du cycle 4 (5e, 4e, 3e), en gardant les règles dys du brief. Les huit îles actuelles sont le niveau 6e (fin de cycle 3).

## 1. Principes

- **Une île = un thème du programme**, trois quêtes par île, deux ou trois niveaux par quête, huit items par exercice. Créature, bloc, décor, trois plans et un Gardien par île, comme aujourd'hui.
- **Le contenu monte, les règles ne changent pas** : un item par écran, consigne unique lue à voix haute, aide visuelle ou rappel de règle toujours visible, réponses en ordre stable, indice jamais pénalisant, pas de chrono, correction qui explique. En 4e-3e, l'énoncé peut être plus long mais reste découpé (syllabes ou lignes courtes).
- **Maths générées** : chaque quête de maths est un générateur reproductible (`exercises/maths.ts`, `exercises/college.ts`), avec des aides en données (droite graduée, tableau de proportionnalité, figure, tableau de valeurs). **Français en données** : fichiers JSON écrits à la main (`exercises/data/*.json`), écran QCM ou dictée à choix existants, plus un écran « règle » pour les accords et la conjugaison.
- **Classe affichée** (« Niveau 5e ») sur les cartes et les panneaux ; les pages Français et Maths listent les îles de leur matière, de la 6e à la 3e. Aucune île n'est imposée : les ponts restent le seul verrou, un élève de 3e peut commencer par la Forêt.

## 2. L'archipel agrandi

Rangées de l'archipel (la rangée 0 est celle de la Forêt ; les rangées négatives sont derrière, les positives devant, vers la caméra). Colonnes 0 à 4.

| Rangée | Matière, classes | Îles (colonne) |
| --- | --- | --- |
| −1 (derrière) | Français 5e → 3e | Cabinet des mots (0), Marais des temps (1), Carrefour des homophones (2), Falaise des accords (3), Observatoire des textes (4) |
| 0 | Français 6e | Carrière (0), Mine (1), Forêt (2), Ferme (3), Tour (4) |
| 1 | Maths 6e | Rivière (1), Plaine (2), Volcan (3) |
| 2 | Maths 5e → 3e | Atelier du calcul littéral (0), Marché des proportions (1), Glacier des relatifs (2), Forge des puissances (3), Belvédère de Thalès (4) |
| 3 (devant) | Maths 3e | Observatoire des données (1), Phare des fonctions (3) |

Ponts : verticaux depuis la rangée voisine (6 à 8 blocs), horizontaux dans la rangée (6 à 7 blocs). Coûts croissants pour que les blocs des nouvelles îles servent. Chaque île de cycle 4 a au moins deux accès.

## 3. Les îles, quête par quête

### Français

| Île (classe) | Bloc, créature, Gardien | Quêtes |
| --- | --- | --- |
| Carrefour des homophones (5e) | panneau (bois peint), Sema le caméléon, le Sphinx des routes | **Panneaux** : ses / ces / c'est / s'est, la / là / l'a, ou / où, leur / leurs (jeux de la quête Homophones) ; **Aiguillage** : quand / quant / qu'en, peu / peut / peux, mais / mes / met ; **Bifurcation** : phrase à trou avec deux homophones d'affilée |
| Marais des temps (5e-4e) | tourbe, Kroa le triton, l'Hydre des marais | **Rives du passé** : imparfait / passé composé / passé simple ; **Brume du futur** : futur / conditionnel ; **Nénuphar du subjonctif** : subjonctif présent après « il faut que », « bien que » ; identifier le temps d'un verbe |
| Falaise des accords (4e) | ardoise, Cléa la chèvre, le Bélier de granit | **Corde du participe** : participe passé avec être / avoir / COD placé avant ; **Paroi des adjectifs** : accord adjectif-nom, attribut ; **Sommet du sujet** : sujet inversé, sujet éloigné, « on », « chacun » |
| Cabinet des mots (4e-3e) | parchemin, Plume la pie, le Hibou lexicographe | **Racines** : préfixes et racines gréco-latines (télé-, -phone, bio-, -logie) ; **Sens** : sens propre / figuré, polysémie ; **Nuances** : synonymes, antonymes, registres de langue |
| Observatoire des textes (3e) | lentille (verre teinté), Astra la luciole, le Grand Lecteur | **Inférences** : ce que le texte laisse entendre ; **Figures** : métaphore, comparaison, hyperbole, personnification ; **Rouages** : nature et fonction des mots, connecteurs logiques |

### Maths

| Île (classe) | Bloc, créature, Gardien | Quêtes |
| --- | --- | --- |
| Glacier des relatifs (5e-4e) | glace, Frimas le pingouin, le Mammouth de givre | **Thermomètre** : comparer et ranger des relatifs (droite graduée) ; **Banquise** : additions et soustractions ; **Crevasses** : multiplications et divisions (règle des signes) |
| Marché des proportions (5e-3e) | étal (toile), Bazar le raton, le Colporteur | **Étals** : tableau de proportionnalité (quatrième proportionnelle) ; **Remises** : pourcentages (prendre, augmenter, baisser) ; **Balances** : échelles, vitesses, conversions |
| Forge des puissances (4e-3e) | acier, Braise le forgeron-golem, le Titan d'acier | **Étincelles** : puissances de 10 et notation scientifique (tableau de rangs) ; **Enclume** : puissances d'un nombre, règles a^n × a^m ; **Trempe** : racines carrées, diviseurs et nombres premiers |
| Atelier du calcul littéral (4e-3e) | plan (papier quadrillé), Ixe le robot, le Golem des équations | **Réduire** : réduire une expression ; **Développer** : distributivité simple et double ; **Équilibre** : équations du premier degré, tester une égalité |
| Belvédère de Thalès (4e-3e) | marbre, Théo le héron, le Sphinx de marbre | **Pythagore** : hypoténuse ou côté (figure codée) ; **Thalès** : longueur manquante (configuration codée) ; **Trigo** : cosinus, sinus, tangente (choisir le bon rapport) |
| Observatoire des données (3e) | quartz, Stat la chouette, le Comptable des étoiles | **Moyenne** : moyenne, médiane, étendue d'une petite série (barres) ; **Chances** : probabilités simples (urnes, dés) ; **Lecture** : lire un diagramme |
| Phare des fonctions (3e) | prisme, Fi le phare-lampe, le Dragon de lumière | **Images** : image et antécédent (tableau de valeurs) ; **Droites** : fonctions linéaires et affines (coefficient, ordonnée à l'origine) ; **Lecture** : lire une représentation graphique |

## 4. Aides visuelles à ajouter (données → composant)

- `number-line` (droite graduée avec négatifs), `ratio-table` (tableau de proportionnalité), `bar-list` (petite série en barres), `value-table` (x → f(x)), `right-triangle` / `thales-figure` (figures codées), `rule-card` (rappel de règle de grammaire, texte court lu à voix haute).

## 5. Découpage en PR

1. ✅ Socle : classe et matière par île, badge « Maître de l'archipel », îles Blocland sur les pages Français et Maths, ce cadrage.
2. ✅ Glacier des relatifs + Marché des proportions (maths 5e).
3. ✅ Carrefour des homophones + Marais des temps (français 5e-4e).
4. Forge des puissances + Atelier du calcul littéral (maths 4e-3e).
5. Falaise des accords + Cabinet des mots (français 4e-3e).
6. Belvédère de Thalès + Observatoire des données + Phare des fonctions (maths 3e).
7. Observatoire des textes (français 3e) et finitions (succès par classe, journal).
