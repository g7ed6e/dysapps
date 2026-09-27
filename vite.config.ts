/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { appVersion } from './scripts/version.mjs';
import { exerciseMeta } from './scripts/exerciseMeta.mjs';
import { splashLinks } from './scripts/splash-devices.mjs';

// Deux cibles de déploiement :
// - GitHub Pages sert le site dans un sous-dossier (https://<utilisateur>.github.io/dysapps/) : DEPLOY_TARGET=github ;
// - Cloudflare Workers le sert à la racine : aucune variable, base « / ».
// BASE_PATH, s'il est défini, force un autre sous-dossier.
const base = process.env.BASE_PATH ?? (process.env.DEPLOY_TARGET === 'github' ? '/dysapps/' : '/');

// Politique de sécurité du contenu : GitHub Pages ne permet pas d'en-têtes HTTP,
// on l'injecte donc en <meta> au build (le serveur de dev Vite a besoin de scripts inline).
// Le site n'appelle aucun domaine externe : tout est limité à 'self'.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function securityHeaders(): Plugin {
  return {
    name: 'dysapps-security-meta',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
      { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
    ],
  };
}

// Écrans de lancement d'iPhone et d'iPad : Safari ne les compose pas à partir du manifeste (Android, si). Une image par
// appareil et par orientation, fabriquée par `npm run splash` dans public/splash/.
function appleSplash(): Plugin {
  return {
    name: 'dysapps-apple-splash',
    transformIndexHtml: () => splashLinks(base).map((attrs) => ({ tag: 'link', attrs, injectTo: 'head' as const })),
  };
}

export default defineConfig({
  base,
  // La version se déduit de l'historique git (scripts/version.mjs) : aucune pull request ne l'écrit.
  define: { __APP_VERSION__: JSON.stringify(appVersion()) },
  build: {
    // Jamais d'inclusion en data: (la CSP n'autorise que les fichiers du site).
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    exerciseMeta(),
    securityHeaders(),
    appleSplash(),
    VitePWA({
      // La mise à jour est proposée (bande + bouton), jamais imposée en pleine partie.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Archipéo – Entraînement collège',
        short_name: 'Archipéo',
        description: 'Le savoir construit ton monde : français, maths et anglais pour les élèves dys du collège, par DysApps',
        lang: 'fr',
        theme_color: '#13283d',
        background_color: '#f3eee3',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Tout ce qui sert hors ligne, y compris les fichiers chargés à la demande (3D, quêtes, exercices)
        // et les textures PNG de l'interface.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Les écrans de lancement (un par appareil) ne servent qu'au démarrage de l'appli installée sur iPhone et iPad :
        // les précharger ferait télécharger 1 Mo d'images à tous les élèves.
        globIgnores: ['splash/**'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
