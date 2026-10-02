// Le rangement du dépôt : chaque fichier suivi par git est à sa place, selon la section « Où va quoi » de CLAUDE.md.
// Un nouvel emplacement se décide d'abord (avec l'expert frontend), s'écrit dans « Où va quoi », puis s'ajoute ici.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
// Les fichiers suivis, et ceux pas encore ajoutés mais non ignorés : un fichier mal rangé échoue dès qu'il est écrit.
const fichiers = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: racine, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

/** Ce que la racine peut contenir : un dossier (avec « / ») ou un fichier. */
const RACINE = [
  '.claude/', '.github/', 'docs/', 'public/', 'scripts/', 'src/', 'www/',
  '.gitignore', '.npmrc', 'AGENTS.md', 'CLAUDE.md', 'LICENSE', 'README.md',
  'index.html', 'package-lock.json', 'package.json', 'tsconfig.json', 'vite.config.ts', 'wrangler.jsonc',
];

const page = String.raw`(?:[a-z0-9-]+|README)\.md`;

/** Les dossiers rangés : ce qu'ils acceptent, et ce qui doit y aller (le message d'erreur). */
const REGLES = [
  {
    dossier: 'docs/',
    motif: new RegExp(String.raw`^docs/(${[
      String.raw`(conception|ux-ui|rendu|pilotage)/${page}`,
      String.raw`contenu/(${page}|portail/${page})`,
      String.raw`gameplay/(${page}|propositions/(GD-\d+|modele)\.md)`,
      String.raw`univers/(${page}|blocland/${page}|archipeo/(${page}|intentions/${page}|esquisses/(${page}|atelier/[a-z0-9-]+\.(html|js|mjs))|source/.+))`,
    ].join('|')})$`),
    consigne: 'docs/ ne tient que la documentation interne : conception/, gameplay/ (propositions/GD-<n>.md), univers/ (archipeo/, blocland/), ux-ui/, rendu/, contenu/, pilotage/ ; une page <nom>.md, sauf les esquisses et le dossier source d’Archipéo',
  },
  {
    dossier: 'www/',
    motif: /^www\/(index\.md|manuel\/[a-z0-9-]+\.md|pedagogie\/[a-z0-9-]+\.md|_theme\/[^/]+|\.vitepress\/.+)$/,
    consigne: 'www/ ne publie que l’accueil, le manuel (www/manuel/) et le contenu pédagogique (www/pedagogie/) ; rien d’interne',
  },
  {
    dossier: '.claude/',
    motif: /^\.claude\/(agents\/[a-z0-9-]+\.md|skills\/[a-z0-9-]+\/.+)$/,
    consigne: '.claude/ ne tient que les agents (.claude/agents/<agent>.md) et les skills (.claude/skills/<skill>/SKILL.md)',
  },
  {
    dossier: 'scripts/',
    motif: /^scripts\/([a-zA-Z0-9-]+\.(mjs|d\.mts|test\.mjs)|(contenu|pilotage|programme|rendu|www)\/.+)$/,
    consigne: 'scripts/ : un script à la racine, ou dans contenu/, pilotage/, programme/, rendu/, www/',
  },
];

describe('le rangement du dépôt (CLAUDE.md, « Où va quoi »)', () => {
  it('ne met à la racine que ce qui y est prévu', () => {
    const horsPlace = [...new Set(fichiers.map((f) => (f.includes('/') ? `${f.split('/')[0]}/` : f)))].filter((e) => !RACINE.includes(e));
    expect(horsPlace, 'nouvel élément à la racine : le ranger dans un dossier existant, ou décider sa place dans « Où va quoi »').toEqual([]);
  });

  it.each(REGLES)('range $dossier', ({ dossier, motif, consigne }) => {
    expect(fichiers.filter((f) => f.startsWith(dossier) && !motif.test(f)), consigne).toEqual([]);
  });

  it('déclare au sommaire du site chaque page écrite à la main, et rien d’autre que le manuel et le contenu pédagogique', () => {
    const nav = JSON.parse(readFileSync(join(racine, 'www/_theme/nav.json'), 'utf8'));
    expect(nav.sections.map((s) => s.title)).toEqual(['Manuel', 'Contenu pédagogique']);
    const declarees = new Set(nav.sections.flatMap((s) => s.pages).filter((p) => typeof p === 'string'));
    const pages = fichiers.filter((f) => /^www\/(manuel|pedagogie)\/.+\.md$/.test(f)).map((f) => f.slice('www/'.length));
    expect(pages.filter((p) => !declarees.has(p)), 'page absente du sommaire www/_theme/nav.json').toEqual([]);
  });
  it('ne laisse aucun lien ni aucune ancre cassés dans la documentation interne (lue sur GitHub)', () => {
    // L’ancre de GitHub : minuscules, accents gardés, ponctuation retirée, chaque espace devient un tiret.
    const ancre = (titre) => titre.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const sansCode = (texte) => texte.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    const ancres = (chemin) => [...sansCode(readFileSync(chemin, 'utf8')).matchAll(/^#+\s+(.*)$/gm)].map((m) => ancre(m[1]));
    const pages = fichiers.filter((f) => /^(docs\/.+|AGENTS|CLAUDE|README)\.md$/.test(f) && !f.startsWith('docs/univers/archipeo/source/') && existsSync(join(racine, f)));
    const casses = pages.flatMap((page) => [...sansCode(readFileSync(join(racine, page), 'utf8')).matchAll(/\]\(([^)\s]+)\)/g)]
      .map((m) => m[1])
      .filter((lien) => !/^(https?:|mailto:)/.test(lien))
      .filter((lien) => {
        const [chemin, cible] = lien.split('#');
        const fichier = chemin ? resolve(racine, dirname(page), decodeURI(chemin)) : join(racine, page);
        if (!existsSync(fichier)) return true;
        return Boolean(cible) && fichier.endsWith('.md') && !ancres(fichier).includes(decodeURIComponent(cible));
      })
      .map((lien) => `${page} → ${lien}`));
    expect(casses, 'lien ou ancre cassé : corriger le chemin, ou écrire l’ancre comme GitHub (accents gardés, ponctuation retirée)').toEqual([]);
  });
});
