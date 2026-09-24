# DysApps

Applications d’entraînement pour les **élèves dys du collège** (dyslexie, dysorthographie, dyscalculie), utilisables en autonomie sur tablette, téléphone ou ordinateur.

Site en ligne : https://g7ed6e.github.io/dysapps/

## Ce que contient le socle

- **Style Street / BD** pensé pour des ados : cases de BD, onomatopées, couleurs vives, icônes (Lucide). Les polices « affiche » (Archivo Black, Bangers) ne servent qu’aux titres courts : le texte à lire reste dans la police dys choisie.
- **Portail** : accueil par matière (Français, Maths) et catalogue des quêtes.
- **Réglages d’affichage** : police (Atkinson Hyperlegible, OpenDyslexic, Verdana), taille, interlignage, espacement des lettres et des mots, thèmes (BD, BD nuit, sobre, contraste élevé), réduction des animations.
- **Lecture vocale** : bouton 🔊 sur les consignes (synthèse vocale du navigateur, sans serveur), vitesse réglable et lecture automatique en option.
- **Gamification** : XP, niveaux et rangs (Bronze I → Diamant III, puis Légende), combos, 12 succès, et des messages façon jeu vidéo (« BIEN VU ! », « COMBO x5 », « QUÊTE TERMINÉE »).
- **Pas de stress** : pas de chronomètre, un joker (indice) disponible avant de répondre ou après une erreur, et un point d’effort même quand la réponse est fausse.
- **Moteur d’exercices** `QuizSession`, réutilisable par toutes les activités.
- **Progression enregistrée sur l’appareil** (`localStorage`) : pas de compte, pas de serveur, aucune donnée ne quitte l’appareil.
- **PWA** : l’application s’installe sur l’écran d’accueil et fonctionne hors ligne après la première visite.

## Quêtes disponibles

- **Homophones** (Français) : 13 paires réparties en 3 niveaux — Les bases (6e) : a/à, et/est, son/sont, on/ont ; Confirmé (5e) : ces/ses, ou/où, ce/se, la/là/l’a ; Expert (4e-3e) : leur/leurs, quand/quant/qu’en, peu/peut/peux, -é/-er, c’est/s’est. Quêtes de 10 phrases par niveau ou entraînement ciblé sur une paire. Le joker donne l’astuce de remplacement (« remplace par *avait* »), la correction rappelle la règle. Les phrases sont dans `src/apps/homophones/sets.json` (vérifiées par les tests : un seul trou, jamais en début de phrase, chaque réponse travaillée).

## Développer

```bash
npm install
npm run dev        # serveur local : http://localhost:5173/dysapps/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
```

## Ajouter une activité

1. Créer un dossier `src/apps/<id>/` avec un composant par défaut, par exemple :

   ```tsx
   import { QuizSession, type Question } from '../../components/QuizSession';

   function makeQuestions(): Question[] {
     return [
       { id: 'q1', prompt: 'Complète : « Ils … partis. »', choices: ['sont', 'son'], answer: 'sont',
         hint: 'Remplace par « étaient ».', explanation: '« Ils étaient partis » : verbe être.' },
     ];
   }

   export default function MonApp() {
     return <QuizSession appId="<id>" makeQuestions={makeQuestions} />;
   }
   ```

2. Dans `src/apps/registry.ts`, passer l’activité à `status: 'disponible'` et ajouter
   `component: lazy(() => import('./<id>/MonApp'))`.

`makeQuestions` est rappelée à chaque nouvelle séance, ce qui permet de générer des questions aléatoires.

## Déploiement

Le workflow `.github/workflows/deploy.yml` lance les tests et le build à chaque push et à chaque pull request, puis publie sur GitHub Pages à chaque push sur `main`.

À faire une seule fois : dans **Settings → Pages** du dépôt, choisir **Source : GitHub Actions**.

## Sécurité

- **Pipeline** : aucune permission par défaut ; seul le job `deploy`, qui n’exécute pas de code du dépôt, peut publier sur Pages. Actions épinglées par SHA (mises à jour par Dependabot), `persist-credentials: false`, pas de cache partagé, `npm ci --ignore-scripts` et vérification des signatures npm (`npm audit signatures`).
- **Site** : Content-Security-Policy stricte injectée au build (aucune ressource externe), `referrer` désactivé, aucune donnée envoyée hors de l’appareil.
- Les scripts d’installation npm sont aussi désactivés en local (`.npmrc`).

## Arborescence

```
src/
  apps/          activités (une par dossier) + registry.ts (catalogue)
  components/    Layout, Mascot, QuizSession, SpeakButton, XpBar…
  core/          réglages, synthèse vocale, progression/gamification, stockage
  pages/         accueil, matière, activité, réglages, progression
  styles/        thèmes et styles globaux
```

## Feuille de route

- Français : lecture et compréhension (textes du domaine public)
- Maths : tables et calcul mental, fractions, nombres décimaux et numération
