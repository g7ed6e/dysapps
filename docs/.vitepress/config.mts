// Site de documentation (https://g7ed6e.github.io/dysapps/), construit avec VitePress.
// Les sources sont préparées dans .docs-src/ (pages de docs/ + pages générées depuis les données du jeu),
// le sommaire vient de docs/_theme/nav.json. Aucune ressource externe.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type DefaultTheme } from 'vitepress';
import { nav, prepareDocs, SRC } from '../../scripts/docs/prepare.mjs';
import { appVersion } from '../../scripts/version.mjs';

const version = appVersion();
const pages = await prepareDocs();
const byPath = new Map(pages.map((p) => [p.path, p]));
const link = (path: string) => '/' + path.replace(/\.md$/, '.html');

// ---------- Sommaire (docs/_theme/nav.json) ----------

type NavItem = string | { dir: string; title: string };
const sidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Accueil', link: '/' },
  ...nav.sections.map((section: { title: string; pages: NavItem[] }) => ({
    text: section.title,
    items: section.pages.map((item): DefaultTheme.SidebarItem => {
      if (typeof item === 'string') {
        const page = byPath.get(item);
        if (!page) throw new Error(`Page absente : docs/${item} (référencée dans docs/_theme/nav.json)`);
        return { text: page.title, link: link(page.path) };
      }
      const children = pages.filter((p) => p.path.startsWith(`${item.dir}/`) && !p.path.slice(item.dir.length + 1).includes('/'));
      if (children.length === 0) throw new Error(`Dossier vide : docs/${item.dir}`);
      return { text: item.title, collapsed: true, items: children.map((p) => ({ text: p.title, link: link(p.path) })) };
    }),
  })),
];
const listed = new Set(JSON.stringify(sidebar).match(/"link":"[^"]+"/g)?.map((s) => s.slice(8, -1)));
for (const p of pages) {
  if (p.path !== 'index.md' && !listed.has(link(p.path))) console.warn(`(!) docs/${p.path} n'est dans aucune section de nav.json : page construite, mais hors sommaire.`);
}

// ---------- Ancres (identiques à l'ancien site : liens externes stables) ----------

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------- Politique de sécurité du contenu ----------
// GitHub Pages n'envoie pas d'en-têtes : la CSP est posée en <meta> sur chaque page,
// avec l'empreinte des quelques scripts en ligne que VitePress écrit (thème clair/sombre, données du site).

const CSP_BASE = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
];

function htmlFiles(dir: string, list: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function addCsp(file: string) {
  const html = readFileSync(file, 'utf8');
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .filter((m) => m[1].trim())
    .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  const csp = [...CSP_BASE, `script-src 'self' ${[...new Set(hashes)].join(' ')}`.trim()].join('; ');
  writeFileSync(file, html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`));
}

// ---------- Site ----------

export default defineConfig({
  srcDir: SRC,
  outDir: '../dist-docs',
  // « / » en local, « /dysapps/ » sur GitHub Pages (variable posée par la CI).
  base: process.env.BASE_PATH ?? '/',
  lang: 'fr-FR',
  title: 'Documentation DysApps',
  titleTemplate: ':title · Documentation DysApps',
  description: 'Manuel et contenu pédagogique de DysApps, applications d’entraînement pour les élèves dys du collège.',
  cleanUrls: false,
  srcExclude: ['public/**'],
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${process.env.BASE_PATH ?? '/'}icon.svg` }],
    ['meta', { name: 'theme-color', content: '#6b4a2e' }],
    ['meta', { name: 'referrer', content: 'no-referrer' }],
  ],
  markdown: { anchor: { slugify } },
  vite: { server: { fs: { allow: [process.cwd()] } } },
  // Date de mise à jour : dernier commit de la page source (docs/…), ou date du build pour une page générée.
  transformPageData(pageData) {
    const page = byPath.get(pageData.relativePath);
    if (page) pageData.lastUpdated = page.updated ? Date.parse(page.updated) : undefined;
  },
  buildEnd(site) {
    for (const file of htmlFiles(site.outDir)) addCsp(file);
  },
  themeConfig: {
    logo: '/icon.svg',
    siteTitle: 'DysApps · Documentation',
    nav: [{ text: 'Ouvrir l’application', link: nav.appUrl, target: '_blank', rel: 'noopener' }],
    sidebar,
    socialLinks: [{ icon: 'github', link: nav.repoUrl, ariaLabel: 'Code source sur GitHub' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher dans la documentation' },
          modal: {
            displayDetails: 'Afficher le détail',
            resetButtonTitle: 'Effacer la recherche',
            backButtonTitle: 'Fermer la recherche',
            noResultsText: 'Aucun résultat pour',
            footer: { selectText: 'ouvrir', navigateText: 'naviguer', closeText: 'fermer' },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'Sur cette page' },
    docFooter: { prev: 'Précédent', next: 'Suivant' },
    lastUpdated: { text: 'Mise à jour le', formatOptions: { dateStyle: 'long' } },
    // Chaîne et non fonction : une fonction serait évaluée dans le navigateur, ce que la CSP interdit.
    // Les pages générées n'ont pas ce lien (editLink: false, posé par scripts/docs/prepare.mjs).
    editLink: {
      pattern: `${nav.repoUrl}/blob/main/docs/:path`,
      text: 'Voir la source de cette page',
    },
    footer: {
      message: `DysApps ${version} · applications d’entraînement pour les élèves dys du collège · code source sous licence MIT · police Luciole © Laurent Bourcellier &amp; Jonathan Fabreguettes, CC BY 4.0.`,
      copyright: 'Aucune donnée n’est collectée : ce site n’utilise ni cookie ni service externe.',
    },
    notFound: {
      title: 'Page introuvable',
      quote: 'Cette adresse n’existe pas (ou plus).',
      linkLabel: 'Retour à l’accueil de la documentation',
      linkText: 'Retour à la documentation',
    },
    sidebarMenuLabel: 'Sommaire',
    returnToTopLabel: 'Retour en haut',
    darkModeSwitchLabel: 'Apparence',
    lightModeSwitchTitle: 'Passer en thème clair',
    darkModeSwitchTitle: 'Passer en thème sombre',
    skipToContentLabel: 'Aller au contenu',
    externalLinkIcon: true,
  },
});
