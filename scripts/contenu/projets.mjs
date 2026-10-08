// Les grands projets (GD-10, piste A choisie par le mainteneur le 8 octobre 2026), écrits en Markdown dans
// docs/contenu/projets.md : les pièces de chaque projet, leurs deux recettes et les questions qu'elles posent, et le nom
// de chaque pièce dans chaque univers. Ils redonnent src/game/world/projects.json ; la forme des pièces (les étages du
// monument) reste dans le code (src/game/world/projects.ts). Sa section « ## Les questions » donne les banques de
// questions des recettes, écrites comme celles des blocs assemblés (assemblage.mjs), qui redonnent
// src/game/exercises/data/assembly-<banque>.json.
//
//   | projet | pièce | recette 1 | questions 1 | recette 2 | questions 2 | Blocland | Archipéo |
//   | `landmark-5e-1` | `base` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | … | … | Le socle | Le socle |
//
// Une recette prend des blocs de deux îles de l'archipel du projet, de deux matières ; les deux recettes d'une pièce
// n'ont aucune matière en commun, et jamais la LV2 (GD-10 : une matière difficile ne bloque jamais).
import { lireQuestions } from './assemblage.mjs';
import { lireTexte } from './texte.mjs';

export const FICHIER_PROJETS = 'projets.md';

const UNIVERS = [
  ['Blocland', 'blocland'],
  ['Archipéo', 'archipeo'],
];
const COLONNES = ['projet', 'pièce', 'recette 1', 'questions 1', 'recette 2', 'questions 2', ...UNIVERS.map(([nom]) => nom)];
const SEP = ' · ';
const ID = /^`([a-z0-9-]+)`$/;

/**
 * Lit le tableau « ## Les pièces » de docs/contenu/projets.md. Rend `[{ monument, pieces: [{ id, recipes: [{ ingredients:
 * [{ bloc, n }], bank }], names: { <univers>: nom } }] }]`, dans l'ordre du fichier (les pièces d'un projet, de bas en
 * haut).
 */
export function lireProjets(md, fichier) {
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  const erreur = (n, m) => new Error(`${fichier}, ligne ${n + 1} : ${m}`);
  const debut = lignes.indexOf('## Les pièces');
  if (debut < 0) throw new Error(`${fichier} : la section « ## Les pièces » manque`);
  let i = debut + 1;
  while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
  const cases = (n) => {
    const l = lignes[n];
    if (!l?.startsWith('|') || !l.endsWith('|') || l.length < 2) throw erreur(n, `ligne de tableau attendue, lu « ${l ?? ''} »`);
    return l.slice(1, -1).split('|').map((c) => c.trim());
  };
  if (cases(i).join('|') !== COLONNES.join('|')) throw erreur(i, `colonnes attendues : ${COLONNES.join(', ')}`);
  const sep = cases(i + 1);
  if (sep.length !== COLONNES.length || !sep.every((c) => /^:?-+:?$/.test(c))) throw erreur(i + 1, 'ligne « |---|---| » attendue');
  const id = (v, n, quoi) => {
    const m = ID.exec(v);
    if (!m) throw erreur(n, `${quoi} attendu entre accents graves, lu « ${v} »`);
    return m[1];
  };
  const recette = (v, n) =>
    v.split(SEP).map((part) => {
      const b = /^([a-z0-9-]+) × ([1-9]\d*)$/.exec(part);
      if (!b) throw erreur(n, `recette : « bloc × nombre » attendu, lu « ${part} »`);
      return { bloc: b[1], n: Number(b[2]) };
    });
  const projets = [];
  for (i += 2; i < lignes.length && lignes[i].startsWith('|'); i++) {
    const r = cases(i);
    if (r.length !== COLONNES.length) throw erreur(i, `${COLONNES.length} cases attendues, lu ${r.length}`);
    const monument = id(r[0], i, 'identifiant de projet');
    let projet = projets.find((p) => p.monument === monument);
    if (!projet) projets.push((projet = { monument, pieces: [], lignes: [] }));
    const piece = id(r[1], i, 'identifiant de pièce');
    if (projet.pieces.some((p) => p.id === piece)) throw erreur(i, `la pièce « ${piece} » est écrite deux fois`);
    const names = {};
    UNIVERS.forEach(([, u], k) => {
      try {
        names[u] = lireTexte(r[6 + k], i + 1);
      } catch (e) {
        throw new Error(`${fichier}, ${e.message}`);
      }
    });
    projet.pieces.push({
      id: piece,
      recipes: [
        { ingredients: recette(r[2], i), bank: id(r[3], i, 'banque de questions') },
        { ingredients: recette(r[4], i), bank: id(r[5], i, 'banque de questions') },
      ],
      names,
    });
    projet.lignes.push(i);
  }
  if (projets.length === 0) throw new Error(`${fichier} : aucun projet`);
  return projets;
}

/**
 * Vérifie les projets contre les îles du jeu (src/game/islands.ts) et les banques connues (les blocs assemblés, dont
 * les questions sont dans assemblage.md, et celles de projets.md) : des blocs d'îles de l'archipel du projet, de deux
 * matières, sans LV2 ; deux recettes sans matière commune. Rend les projets au format de projects.json.
 */
export function verifierProjets(projets, iles, monuments, banques, fichier) {
  const ile = new Map(iles.map((b) => [b.block, b]));
  return projets.map(({ monument, pieces, lignes }) => {
    const classe = monuments.get(monument);
    if (!classe) throw new Error(`${fichier}, ligne ${lignes[0] + 1} : grand ouvrage « ${monument} » inconnu (${[...monuments.keys()].join(', ')})`);
    if (pieces.length < 3 || pieces.length > 6) throw new Error(`${fichier}, projet ${monument} : trois à six pièces, lu ${pieces.length}`);
    pieces.forEach((p, k) => {
      const erreur = (m) => new Error(`${fichier}, ligne ${lignes[k] + 1} : ${m}`);
      const matieres = p.recipes.map((rec, j) => {
        if (!banques.includes(rec.bank)) throw erreur(`recette ${j + 1} : banque de questions « ${rec.bank} » inconnue (${banques.join(', ')})`);
        if (rec.ingredients.length !== 2) throw erreur(`recette ${j + 1} : des blocs de deux îles`);
        const m = rec.ingredients.map(({ bloc }) => {
          const b = ile.get(bloc);
          if (!b) throw erreur(`recette ${j + 1} : « ${bloc} » n’est le bloc d’aucune île`);
          if (b.classe !== classe) throw erreur(`recette ${j + 1} : « ${bloc} » vient d’une île de ${b.classe}, pas de ${classe}`);
          if (b.subject === 'lv2') throw erreur(`recette ${j + 1} : la LV2 n’est jamais une recette (GD-10)`);
          return b.subject;
        });
        if (m[0] === m[1]) throw erreur(`recette ${j + 1} : deux îles de matières différentes`);
        return m;
      });
      if (matieres[0].some((m) => matieres[1].includes(m))) throw erreur('les deux recettes d’une pièce n’ont aucune matière en commun (GD-10)');
    });
    return { monument, pieces: pieces.map(({ id, recipes, names }) => ({ id, recipes, names })) };
  });
}

/** Les banques de questions de projets.md (« ### Nom · `banque` »), lues comme celles des blocs assemblés. */
export function lireBanques(md, fichier) {
  const banques = [...md.replace(/\r\n/g, '\n').matchAll(/^### .+ · `([a-z0-9-]+)`$/gm)].map((m) => m[1]);
  for (const b of banques) if (!b.startsWith('project-')) throw new Error(`${fichier} : une banque de questions s’appelle « project-… », lu « ${b} »`);
  return lireQuestions(md, fichier, banques);
}
