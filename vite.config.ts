/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { appVersion } from './scripts/version.mjs';
import { exerciseMeta } from './scripts/exerciseMeta.mjs';
import { splashLinks } from './scripts/splash-devices.mjs';
import { iconeUrl } from './scripts/icones.mjs';
import { compacterGlb } from './scripts/rendu/compacterGlb.mjs';

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

// Icône de l'onglet et icône d'iPhone et d'iPad, avec l'empreinte de leur dessin (scripts/icones.mjs). Safari ne
// relit jamais l'icône d'une appli déjà sur l'écran d'accueil : l'empreinte garantit au moins qu'une installation
// neuve prend le dessin du jour.
function iconLinks(): Plugin {
  return {
    name: 'dysapps-icon-links',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: base + iconeUrl('icon.svg') }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'apple-touch-icon', href: base + iconeUrl('apple-touch-icon.png') }, injectTo: 'head' },
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

// Les personnages importés d'Archipéo (src/game/importedCharacters.ts) : publiés compactés, sans normales, positions et
// couleurs en entiers (environ trois fois plus légers) ; le serveur de dev sert les fichiers tels quels.
function compactGlb(): Plugin {
  return {
    name: 'dysapps-compact-glb',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.glb') || typeof file.source === 'string') continue;
        file.source = compacterGlb(file.source);
      }
    },
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
    iconLinks(),
    appleSplash(),
    compactGlb(),
    VitePWA({
      // La mise à jour est proposée (bande + bouton), jamais imposée en pleine partie.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        // L'identité de l'appli installée : Chrome et Edge la déduisaient de start_url, on l'écrit pour qu'elle ne
        // bouge plus. Elle ne doit jamais changer, sinon les appareils voient une autre appli (sans ses données).
        id: base,
        name: 'DysApps',
        short_name: 'DysApps',
        description: 'Français, maths et anglais pour les élèves dys du collège, dans le monde de ton choix',
        lang: 'fr',
        theme_color: '#13283d',
        background_color: '#f3eee3',
        display: 'standalone',
        // L'appli se joue en paysage (mot du mainteneur, 10 octobre 2026) : Android installé tourne de lui-même ; Safari ne
        // suit pas cette demande, l'écran « Tourne ton appareil » le dit (components/RotateDevice.tsx).
        orientation: 'landscape',
        start_url: base,
        scope: base,
        // L'empreinte dans l'adresse fait voir aux appareils qu'une icône a changé (scripts/icones.mjs).
        icons: [
          { src: iconeUrl('pwa-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: iconeUrl('pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: iconeUrl('pwa-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: iconeUrl('icon.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Tout ce qui sert hors ligne, y compris les fichiers chargés à la demande (3D, quêtes, exercices), les textures
        // PNG de l'interface et les personnages importés d'Archipéo (.glb, compactés).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,glb}'],
        // Les écrans de lancement (un par appareil) ne servent qu'au démarrage de l'appli installée sur iPhone et iPad :
        // les précharger ferait télécharger 1 Mo d'images à tous les élèves.
        globIgnores: ['splash/**'],
        // Les icônes sont demandées avec leur empreinte (« ?v= ») : le service worker les sert quand même hors ligne.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
