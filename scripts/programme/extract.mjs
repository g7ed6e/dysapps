// Extrait le texte d'un programme officiel (PDF publié sur data.gouv.fr) pour écrire ou vérifier le référentiel
// src/curriculum/. Outil de contribution : rien de ce script n'entre dans l'application.
//
// Usage : npm run programme:extract -- c3        (une source de src/curriculum/sources.ts : c3, c4, c3-2023, c4-te-2024)
//         npm run programme:extract -- <url.pdf>  (un autre PDF, par exemple une future matière ou un autre cycle)
//
// Écrit .programme/<id>.txt (le texte, une marque « ===== PAGE n ===== » par page) et .programme/<id>.toc.txt
// (les lignes qui ressemblent à des titres de discipline ou de domaine, avec leur page), puis affiche ce sommaire.
// Le dossier .programme/ est ignoré par git. Voir docs/conception/programmes.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const OUT = join(process.cwd(), '.programme');

/** Les titres qu'on cherche dans un programme du collège : disciplines, domaines, attendus. */
const HEADINGS = [
  /^(Français|Mathématiques|Langues vivantes( \(étrangères ou régionales\))?|Histoire et géographie|Sciences et technologie|Physique-chimie|Sciences de la vie et de la Terre|Technologie|Arts plastiques|Éducation musicale|Histoire des arts|Éducation physique et sportive|Enseignement moral et civique)$/,
  /^(Langage oral|Lecture et compréhension|Écriture|Étude de la langue|Culture littéraire et artistique)/,
  /^(Nombres et calculs|Grandeurs et mesures|Espace et géométrie|Organisation et gestion de données|Algorithmique et programmation|Thème [A-E] )/,
  /^(Écouter et comprendre|Lire et comprendre|Lire$|Parler en continu|Écrire$|Écrire et réagir|Réagir et dialoguer|Découvrir les aspects culturels|Activités langagières|Connaissances culturelles et linguistiques)/,
  /^(Attendus de fin de cycle|Repères de progressivité|Terminologie utilisée|Niveau (A1|A2|B1)\b)/,
];

async function loadSources() {
  // Le référentiel est en TypeScript : Vite le charge comme le fait le générateur de documentation.
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const mod = await server.ssrLoadModule('/src/curriculum/sources.ts');
    return mod.SOURCES;
  } finally {
    await server.close();
  }
}

async function extract(id, url) {
  const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
  console.log(`Téléchargement : ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = new Uint8Array(await res.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      text += item.str;
      if (item.hasEOL) text += '\n';
    }
    pages.push(text);
  }
  mkdirSync(OUT, { recursive: true });
  const full = pages.map((t, i) => `\n\n===== PAGE ${i + 1} =====\n${t}`).join('');
  writeFileSync(join(OUT, `${id}.txt`), full);
  const toc = [];
  pages.forEach((t, i) => {
    for (const line of t.split('\n')) {
      const l = line.trim();
      if (l && l.length < 90 && HEADINGS.some((re) => re.test(l))) toc.push(`p. ${String(i + 1).padStart(3)}  ${l}`);
    }
  });
  writeFileSync(join(OUT, `${id}.toc.txt`), toc.join('\n') + '\n');
  console.log(`${doc.numPages} pages → .programme/${id}.txt ; sommaire → .programme/${id}.toc.txt\n`);
  console.log(toc.join('\n'));
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage : npm run programme:extract -- <source de sources.ts|url.pdf>');
  process.exit(1);
}
if (/^https?:\/\//.test(arg)) {
  const id = arg.split('/').pop().replace(/\.pdf$/i, '') || 'pdf';
  await extract(id, arg);
} else {
  const sources = await loadSources();
  const source = sources[arg];
  if (!source) {
    console.error(`Source inconnue : ${arg}. Sources : ${Object.keys(sources).join(', ')}, ou une URL de PDF.`);
    process.exit(1);
  }
  await extract(source.id, source.pdfUrl);
}
