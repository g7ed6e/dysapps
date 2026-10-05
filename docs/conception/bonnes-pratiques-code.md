# Bonnes pratiques du code

Cette page rassemble l’état de l’art, en septembre 2026, pour le code d’une application web comme Archipéo, et le met en face de ce que fait le dépôt. Elle sert de base à l’agent `expert-frontend` (voir [Contribuer](contribuer.md#les-agents)), qui relit toute pull request qui modifie du code.

Trois priorités passent avant le reste, dans cet ordre : **la sécurité, la performance, la maintenabilité**. Les conventions qui s’imposent (aucune ressource externe, rien d’emprunté, sauvegardes jamais cassées) sont dans [Contribuer](contribuer.md#conventions-du-dépôt) ; cette page dit **comment bien les tenir dans le code** et **ce qui reste à surveiller**.

## La pile

Les versions de `package-lock.json` au 28 septembre 2026 :

| Outil | Version | Où c’est réglé |
| --- | --- | --- |
| TypeScript | 7.0 (le compilateur natif, écrit en Go, sorti le 8 juillet 2026) | `tsconfig.json` : `strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules` |
| React | 19.3, avec React Router 7 | `src/main.tsx` (`StrictMode`), `src/App.tsx` |
| Vite | 8 (un seul bundler, Rolldown, depuis mars 2026) | `vite.config.ts` |
| Vitest | 5, avec jsdom et Testing Library | `vite.config.ts` (`test`), `src/setupTests.ts` |
| Three.js | r186, rendu WebGL | `src/blocland/three/` |
| Application installable | vite-plugin-pwa (Workbox), mise à jour proposée | `vite.config.ts` (`VitePWA`) |
| CI | GitHub Actions, Node 22 | `.github/workflows/deploy.yml`, `.github/dependabot.yml` |

## 1. Sécurité

- **Une politique de sécurité du contenu stricte** : tout en `'self'`, aucun script ni style en ligne, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`. C’est la meilleure protection contre l’injection de script ; chaque assouplissement (`'unsafe-inline'`, un domaine de plus, `data:` pour les scripts) est à refuser par défaut (MDN, *Content Security Policy*).
- **Pas de HTML construit à partir de texte** : React échappe le texte ; `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` et les chaînes passées à `setTimeout` contournent cette protection (OWASP, *Cross Site Scripting Prevention Cheat Sheet*).
- **Toute donnée lue est non fiable** : stockage local, paramètres d’adresse, fichiers. On la valide avant usage et on garde une valeur par défaut quand elle est absente, ancienne ou abîmée.
- **La chaîne d’approvisionnement npm est la menace la plus active** depuis les vers « Shai-Hulud » de septembre et novembre 2025, qui volaient les secrets de CI par des scripts d’installation (alerte de la CISA, 23 septembre 2025 ; Microsoft, décembre 2025). Les parades reconnues : installer sans exécuter de scripts, depuis le fichier de verrouillage (`npm ci`), vérifier les signatures du registre (`npm audit signatures`), ne pas prendre une version publiée depuis moins de quelques jours (réglage `min-release-age` de npm 11.10, février 2026 ; trois jours dans le préréglage `config:best-practices` de Renovate), et limiter le nombre de dépendances.
- **GitHub Actions** : droits du jeton au minimum, aucun secret exposé aux pull requests, actions mises à jour par Dependabot.

## 2. Performance

- **Les signaux web essentiels** (Core Web Vitals) : affichage du plus grand élément (LCP) sous 2,5 s, réponse aux interactions (INP, qui a remplacé le FID en mars 2024) sous 200 ms, décalage de mise en page (CLS) sous 0,1, mesurés au 75e centile (web.dev). Pour un jeu, l’INP compte le plus : un toucher doit répondre tout de suite, même sur une tablette modeste.
- **Charger peu au démarrage** : découper par route et par fonction lourde (`lazy`, `import()` dynamique), ne rien précharger qui ne sert pas, surveiller la taille des morceaux au build.
- **Ne pas bloquer le fil principal** : une tâche de plus de 50 ms retarde la réponse ; on découpe, on diffère (`requestIdleCallback`, `startTransition`) ou on sort le calcul du rendu.
- **React** : éviter les rendus inutiles d’un gros arbre (état trop haut, valeur de contexte recréée à chaque rendu). Le React Compiler 1.0 (octobre 2025) mémoïse automatiquement et rend la plupart des `useMemo` et `useCallback` manuels inutiles.
- **Three.js** : libérer géométries, matériaux et textures (`dispose`) quand une scène change ; ne rien allouer dans la boucle d’animation ; regrouper les maillages pour réduire les appels de dessin ; plafonner le pixel ratio ; arrêter la boucle quand la vue est cachée (manuel de Three.js, *How to dispose of objects*). Le `WebGPURenderer`, utilisable depuis r171 avec repli automatique sur WebGL 2, demande de réécrire les shaders en TSL : c’est une décision de rendu, pas une mise à jour de routine.

## 3. Maintenabilité

- **TypeScript strict, sans échappatoire** : pas de `any`, peu de `as` et de `!`, des types dérivés des données (`typeof`, `keyof`, `satisfies`), des unions discriminées pour les états. TypeScript 7 vérifie 8 à 12 fois plus vite que la version 6 : le coût du typage complet ne justifie plus de le contourner (annonce de TypeScript 7.0).
- **Les règles de React** : composants et hooks purs, pas de mutation pendant le rendu, hooks appelés au premier niveau. Un effet sert à se synchroniser avec l’extérieur, pas à calculer une valeur dérivée (react.dev, *Rules of React* et *You Might Not Need an Effect*). Ces règles sont vérifiées par `eslint-plugin-react-hooks`, qui porte depuis la version 6 les diagnostics du React Compiler.
- **Séparer la logique de l’affichage** : la logique du jeu en fonctions pures, testées sans navigateur ; le rendu ne décide rien (voir [Séparer le jeu du rendu](separation-jeu-rendu.md)). Un module, un rôle ; un fichier qui dépasse le millier de lignes se découpe.
- **Des tests qui ressemblent à l’usage** : Testing Library, requêtes par rôle et par nom accessible, pas de détail interne (Testing Library, *Guiding Principles*) ; hasard à graine fixe ; le mode navigateur de Vitest, stable depuis la version 4 (octobre 2025), teste dans un vrai navigateur ce que jsdom ne sait pas faire.
- **Le navigateur d’abord** : une fonctionnalité de la plateforme marquée « Baseline, largement disponible » (30 mois après sa disponibilité dans tous les navigateurs principaux, web.dev) s’utilise sans bibliothèque ni solution de repli ; au-delà, on prévoit un repli.
- **Des dépendances peu nombreuses et à jour** : chaque ajout se justifie ; les versions majeures se suivent sans trop de retard, ce que Dependabot propose chaque semaine.

## Accessibilité technique

Ce que l’élève doit vivre est dans les [Bonnes pratiques dys](bonnes-pratiques-dys.md), tenues par le Référent dys ; cette section dit comment le code le rend possible.

- HTML sémantique d’abord ; ARIA seulement quand le HTML ne suffit pas, et selon les motifs de l’*ARIA Authoring Practices Guide* du W3C.
- Tout contrôle a un nom accessible ; le focus est visible, jamais perdu à l’ouverture ou à la fermeture d’un panneau ; tout se fait au clavier.
- La langue est déclarée (`lang="en"` sur un mot anglais) pour que la synthèse vocale et les lecteurs d’écran la suivent.
- Les préférences du système sont respectées : `prefers-reduced-motion`, lue par `src/core/mouvement.ts` pour le monde, le voyage, les créatures et le Filon, et par une règle CSS pour le reste (le réglage de l’appli « Réduire les animations » est retiré le 28 septembre 2026, jusqu’au lot 11 du cadrage Archipéo).
- Critères de référence : WCAG 2.2, repris par le RGAA 5.

## Ce que fait le dépôt

| Pratique | Ce que fait le code | Où le voir |
| --- | --- | --- |
| Politique de sécurité stricte | CSP injectée au build, tout en `'self'`, aucune ressource externe | `vite.config.ts` (`securityHeaders`) |
| Pas de HTML injecté | Aucun `dangerouslySetInnerHTML` ni `innerHTML` dans `src/` | `src/` |
| Installs sûres | `ignore-scripts=true`, `npm ci --ignore-scripts`, `npm audit signatures` en CI | `.npmrc`, `.github/workflows/deploy.yml` |
| Dépendances suivies | Dependabot chaque semaine, npm et actions | `.github/dependabot.yml` |
| TypeScript strict | `strict`, variables et paramètres inutilisés refusés, aucun `any` hors tests ; typage vérifié à chaque build | `tsconfig.json`, `npm run build` |
| Chargement à la demande | 3D et missions en `lazy` ; exercices lus seulement au lancement d’une partie | `src/blocland/three/index.ts`, `src/apps/registry.ts` |
| Ressources 3D libérées | `dispose` des géométries, matériaux et textures ; boucle arrêtée quand l’onglet est caché | `src/blocland/three/` (chaque partie de la scène a son `dispose`) |
| Budget du rendu | Mesures d’appels de dessin et de triangles par archipel | `npm run rendu:mesures`, `npm run rendu:budget` (par poste, sans navigateur), `src/blocland/world/budget.ts` |
| Logique pure et testée | Monde calculé en fonctions pures, empreintes du monde | `src/blocland/world/`, `separation-jeu-rendu.md` |
| Bornes d’erreur | Une page ou une scène qui ne charge pas propose de recharger | `src/components/ErrorBoundary.tsx` |
| Hors ligne | Tout précaché, mise à jour proposée, jamais imposée | `vite.config.ts` (`VitePWA`) |

### À surveiller

Ces points ne sont pas des défauts constatés : ce sont les endroits où le code peut s’éloigner de l’état de l’art, et que l’expert frontend regarde en priorité.

- **Pas de linter** : aucune règle ne vérifie automatiquement les règles de React. Ajouter ESLint avec `eslint-plugin-react-hooks` (préréglage `recommended`) les ferait respecter à chaque pull request.
- **Le React Compiler n’est pas activé** : il mémoïserait sans `useMemo` ni `useCallback` à la main. À décider après le linter, qui dit d’abord quels composants il ne pourrait pas compiler.
- **Les gros fichiers** : `world/landMesh.ts`, `biomes.ts` (`world/terrain.ts` est rangé par métier dans `world/terrain/` depuis le 5 octobre 2026). Chaque lot qui les touche ne les fait pas grossir sans raison.
- **La mesure réelle** : l’INP et les images par seconde se mesurent sur la tablette de référence (`/?mesures`), pas seulement en local.
- **`min-release-age`** : la CI tourne sur Node 22, dont le npm ne connaît pas ce réglage. Passer à Node 24 (LTS) permettrait de l’ajouter à `.npmrc`.
- **WebGPU** : le rendu reste en WebGL ; un passage éventuel au `WebGPURenderer` est une décision de l’artiste technique 3D, avec la réécriture des matériaux en TSL.

## Sources

Consultées en septembre 2026. Un point décisif se revérifie à la source, avec la version installée.

- TypeScript, [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) (juillet 2026)
- React, [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) (7 octobre 2025), [Rules of React](https://react.dev/reference/rules), [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect), [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- Vite, [Vite 8.0 is out!](https://vite.dev/blog/announcing-vite8) (12 mars 2026)
- Vitest, [Vitest 4.0 is out!](https://vitest.dev/blog/vitest-4) (octobre 2025) ; Testing Library, [Guiding Principles](https://testing-library.com/docs/guiding-principles)
- Three.js, [WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html) et [How to dispose of objects](https://threejs.org/manual/#en/how-to-dispose-of-objects)
- web.dev, [Web Vitals](https://web.dev/articles/vitals), [Interaction to Next Paint](https://web.dev/articles/inp), [Baseline](https://web.dev/baseline)
- MDN, [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) ; OWASP, [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- CISA, [Widespread Supply Chain Compromise Impacting npm Ecosystem](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem) (23 septembre 2025) ; Microsoft, [Shai-Hulud 2.0](https://www.microsoft.com/en-us/security/blog/2025/12/09/shai-hulud-2-0-guidance-for-detecting-investigating-and-defending-against-the-supply-chain-attack/) (9 décembre 2025) ; Socket, [npm introduces minimumReleaseAge](https://socket.dev/blog/npm-introduces-minimumreleaseage-and-bulk-oidc-configuration) ; Renovate, [Minimum Release Age](https://docs.renovatebot.com/key-concepts/minimum-release-age/)
- W3C, [WCAG 2.2](https://www.w3.org/TR/WCAG22/) et [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
