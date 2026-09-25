/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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

export default defineConfig({
  base,
  build: {
    // Jamais d'inclusion en data: (la CSP n'autorise que les fichiers du site).
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    securityHeaders(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'DysApps – Entraînement collège',
        short_name: 'DysApps',
        description: "Exercices adaptés aux élèves dys du collège (français et maths)",
        lang: 'fr',
        theme_color: '#6b4a2e',
        background_color: '#fbf6ea',
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
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
