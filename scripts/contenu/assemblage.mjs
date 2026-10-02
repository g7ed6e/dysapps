// L'assemblage des blocs (fiche GD-2), écrit en Markdown dans docs/contenu/assemblage.md : le nom du lieu où l'on assemble
// dans chaque univers, et les blocs assemblés (leur archipel, leur recette, leur nom dans chaque univers). Il redonne
// src/blocland/world/recettes.ts ; le dessin des blocs (couleurs, textures) et du lieu reste dans le code.
// Sa section « ## Les questions » donne la question posée à chaque bloc assemblé : un « ### » par bloc, écrit comme une
// mission d'île (mêmes champs, même lecteur, format.mjs), qui redonne src/blocland/exercises/data/assemblage-<bloc>.json.
import { lireIle } from './format.mjs';
import { lireTexte } from './texte.mjs';

export const FICHIER_ASSEMBLAGE = 'assemblage.md';

/** Les univers, dans l'ordre de leurs colonnes, par le nom qu'ils portent dans le tableau des blocs. */
const UNIVERS = [
  ['Blocland', 'blocland'],
  ['Archipéo', 'archipeo'],
];
const COLONNES_LIEU = ['univers', 'nom', 'à', 'présentation'];
const COLONNES_BLOCS = ['bloc', 'archipel', 'recette', ...UNIVERS.map(([nom]) => nom)];
const CLASSES = ['6e', '5e', '4e', '3e'];
const SEP = ' · ';

/**
 * Lit docs/contenu/assemblage.md. Rend `{ lieu: { <univers>: { titre, a, presentation } }, recettes: [{ bloc,
 * archipelago, ingredients: [{ bloc, n }], noms: { <univers>: { nom, pluriel? } } }] }`.
 */
export function lireAssemblage(md, fichier) {
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  const erreur = (n, m) => new Error(`${fichier}, ligne ${n + 1} : ${m}`);
  const texte = (v, n) => {
    try {
      return lireTexte(v, n + 1);
    } catch (e) {
      throw new Error(`${fichier}, ${e.message}`);
    }
  };

  /** Les rangées du tableau qui suit le titre `titre`, avec leur numéro de ligne. */
  function tableau(titre, colonnes) {
    const debut = lignes.indexOf(titre);
    if (debut < 0) throw new Error(`${fichier} : la section « ${titre} » manque`);
    let i = debut + 1;
    while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
    const cases = (n) => {
      const l = lignes[n];
      if (!l?.startsWith('|') || !l.endsWith('|') || l.length < 2) throw erreur(n, `ligne de tableau attendue, lu « ${l ?? ''} »`);
      return l.slice(1, -1).split('|').map((c) => c.trim());
    };
    if (cases(i).join('|') !== colonnes.join('|')) throw erreur(i, `colonnes attendues : ${colonnes.join(', ')}`);
    const sep = cases(i + 1);
    if (sep.length !== colonnes.length || !sep.every((c) => /^:?-+:?$/.test(c))) throw erreur(i + 1, 'ligne « |---|---| » attendue');
    const rangees = [];
    for (i += 2; i < lignes.length && lignes[i].startsWith('|'); i++) {
      const r = cases(i);
      if (r.length !== colonnes.length) throw erreur(i, `${colonnes.length} cases attendues, lu ${r.length}`);
      rangees.push({ r, n: i });
    }
    return rangees;
  }

  const id = (v, n, quoi) => {
    const m = /^`([a-z0-9-]+)`$/.exec(v);
    if (!m) throw erreur(n, `${quoi} attendu entre accents graves, lu « ${v} »`);
    return m[1];
  };

  const lieu = {};
  for (const { r, n } of tableau('## Le lieu', COLONNES_LIEU)) {
    const u = id(r[0], n, 'identifiant d’univers');
    if (!UNIVERS.some(([, v]) => v === u)) throw erreur(n, `univers « ${u} » inconnu (${UNIVERS.map(([, v]) => v).join(', ')})`);
    if (lieu[u]) throw erreur(n, `l’univers « ${u} » est écrit deux fois`);
    lieu[u] = { titre: texte(r[1], n), a: texte(r[2], n), presentation: texte(r[3], n) };
  }
  for (const [, u] of UNIVERS) if (!lieu[u]) throw new Error(`${fichier} : le lieu n’a pas de nom dans l’univers « ${u} »`);

  const recettes = [];
  for (const { r, n } of tableau('## Les blocs assemblés', COLONNES_BLOCS)) {
    const bloc = id(r[0], n, 'identifiant de bloc');
    if (recettes.some((x) => x.bloc === bloc)) throw erreur(n, `le bloc « ${bloc} » est écrit deux fois`);
    if (!CLASSES.includes(r[1])) throw erreur(n, `archipel « ${r[1]} » inconnu (${CLASSES.join(', ')})`);
    if (recettes.some((x) => x.archipelago === r[1])) throw erreur(n, `l’archipel ${r[1]} a déjà son bloc assemblé`);
    const ingredients = r[2].split(SEP).map((part) => {
      const b = /^([a-z0-9-]+) × ([1-9]\d*)$/.exec(part);
      if (!b) throw erreur(n, `recette : « bloc × nombre » attendu, lu « ${part} »`);
      return { bloc: b[1], n: Number(b[2]) };
    });
    if (new Set(ingredients.map((i) => i.bloc)).size !== ingredients.length) throw erreur(n, 'recette : un bloc y est écrit deux fois');
    const noms = {};
    UNIVERS.forEach(([, u], k) => {
      // « Vitrail (vitraux) » : le pluriel entre parenthèses, quand il ne s'écrit pas en ajoutant un « s ».
      const m = /^([^()]+?)(?: \(([^()]+)\))?$/.exec(texte(r[3 + k], n));
      if (!m) throw erreur(n, `nom de bloc attendu (« Nom » ou « Nom (pluriel) »), lu « ${r[3 + k]} »`);
      noms[u] = m[2] ? { nom: m[1], pluriel: m[2] } : { nom: m[1] };
    });
    recettes.push({ bloc, archipelago: r[1], ingredients, noms });
  }
  if (recettes.length === 0) throw new Error(`${fichier} : aucun bloc assemblé`);
  return { lieu, recettes };
}

export const TITRE_QUESTIONS = '## Les questions';
/** Le type des questions d'assemblage (src/blocland/exercises/registry.ts) et le début de l'identifiant de leurs fichiers. */
export const TYPE_ASSEMBLAGE = 'assembly';
/** L'ordre des champs d'une question d'assemblage dans son JSON. */
const ORDRE_QUESTIONS = ['id', 'bloc', 'type', 'level', 'title', 'lang', 'instruction', 'programme', 'items', 'feedback'];
/** Ce qu'une question d'assemblage n'a pas : elle ne rapporte rien et n'adapte aucun niveau (GD-2). */
const INTERDITS = [
  ['reward', 'ni « bloc gagné », ni « blocs », ni « XP » : une question d’assemblage ne rapporte rien'],
  ['adaptive', 'ni « monte à », ni « descend à » : une question d’assemblage n’adapte aucun niveau'],
  ['perRun', 'pas de « par partie » : une question est posée à la fois'],
  ['target', 'pas de « cible »'],
  ['programme', 'les compétences s’écrivent pour tout le bloc (« - compétences : »), avant la première question'],
];

/** Le début d'une question (ou d'un bloc « Pour tous les items », ou d'un tableau d'items) : là commencent les items. */
const DEBUT_DES_ITEMS = /^(Pour tous les items :$|\d+\. |\|)/;

/**
 * Lit la section « ## Les questions » de docs/contenu/assemblage.md : un « ### Nom · `bloc` » par bloc assemblé, ses
 * champs (compétences, consigne, bravo, erreur, langue), puis ses questions, au format des items d'une île. Rend une
 * question d'assemblage par bloc (le JSON de src/blocland/exercises/data/assemblage-<bloc>.json), ou rien si la section
 * manque. `blocs` : les blocs assemblés connus (le tableau « ## Les blocs assemblés »).
 */
export function lireQuestions(md, fichier, blocs) {
  const lignes = md
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const debut = lignes.indexOf(TITRE_QUESTIONS);
  if (debut < 0) return [];
  let fin = lignes.findIndex((l, n) => n > debut && /^## /.test(l));
  if (fin < 0) fin = lignes.length;
  const erreur = (n, m) => new Error(`${fichier}, ligne ${n + 1} : ${m}`);
  // Les « ### » de la section, chacun jusqu'au suivant.
  const titres = [];
  for (let n = debut + 1; n < fin; n++) {
    const l = lignes[n];
    if (l.startsWith('### ')) {
      const m = /^### (.+) · `([a-z0-9-]+)`$/.exec(l);
      if (!m) throw erreur(n, `« ### Nom · \`bloc\` » attendu, lu « ${l} »`);
      titres.push({ n, titre: m[1], bloc: m[2] });
    } else if (titres.length === 0 && l.trim() !== '' && !l.startsWith('> ')) throw erreur(n, `ligne hors d’un bloc (« ### Nom · \`bloc\` ») : ${l}`);
  }
  const vus = new Set();
  return titres.map(({ n, titre, bloc }, k) => {
    if (!blocs.includes(bloc)) throw erreur(n, `bloc assemblé « ${bloc} » inconnu (${blocs.join(', ')})`);
    if (vus.has(bloc)) throw erreur(n, `les questions du bloc « ${bloc} » sont écrites deux fois`);
    vus.add(bloc);
    const corps = lignes.slice(n + 1, k + 1 < titres.length ? titres[k + 1].n : fin);
    return lireUnBloc(titre, bloc, corps, n, fichier);
  });
}

/**
 * Un bloc de questions, lu comme une île d'une mission à un niveau : l'en-tête et les titres sont ajoutés, les numéros
 * de ligne des erreurs restent ceux du fichier.
 */
function lireUnBloc(titre, bloc, corps, n0, fichier) {
  const id = `${TYPE_ASSEMBLAGE}-${bloc}`;
  const items = corps.findIndex((l) => DEBUT_DES_ITEMS.test(l));
  if (items < 0) throw new Error(`${fichier}, ligne ${n0 + 1} : le bloc « ${bloc} » n’a aucune question`);
  // Chaque ligne du Markdown fabriqué et sa ligne dans le fichier (-1 : ajoutée).
  const fabrique = [
    ['---', -1],
    [`lieu : ${TYPE_ASSEMBLAGE}`, -1],
    ['---', -1],
    [`## ${titre} · \`${bloc}\``, n0],
    ...corps.slice(0, items).map((l, i) => [l, n0 + 1 + i]),
    [`### Niveau 1 · \`${id}\``, n0 + 1 + items],
    ...corps.slice(items).map((l, i) => [l, n0 + 1 + items + i]),
  ];
  let lu;
  try {
    lu = lireIle(fabrique.map(([l]) => l).join('\n'), fichier);
  } catch (e) {
    // « ligne 12 » du Markdown fabriqué → la ligne du fichier.
    throw new Error(e.message.replace(/ligne (\d+)/, (m, x) => `ligne ${(fabrique[Number(x) - 1]?.[1] ?? n0) + 1}`));
  }
  const ou = `${fichier}, bloc « ${bloc} »`;
  const [mission] = lu.biome.exercises;
  const [ex] = lu.exercices;
  if (mission.description !== undefined || mission.lv2 !== undefined)
    throw new Error(`${ou} : ni « description », ni « lv2 » (seulement « compétences » pour tout le bloc)`);
  if (!mission.programme?.length) throw new Error(`${ou} : « compétences » manque`);
  for (const [k, motif] of INTERDITS) if (ex[k] !== undefined) throw new Error(`${ou} : ${motif}`);
  if (!ex.instruction) throw new Error(`${ou} : « consigne » manque`);
  if (!ex.feedback?.correct || !ex.feedback?.wrong) throw new Error(`${ou} : « bravo » et « erreur » sont attendus`);
  // La clé par défaut d'une question est « <bloc>-<rang> » (poutre-0), pas celle d'un niveau d'île.
  const items_ = ex.items.map((it, rang) => (it.key === `${id}-${rang}` ? { ...it, key: `${bloc}-${rang}` } : it));
  const cles = new Map();
  items_.forEach((it, rang) => {
    if (cles.has(it.key))
      throw new Error(
        `${ou} : les questions ${cles.get(it.key) + 1} et ${rang + 1} ont la même clé « ${it.key} » ; donner à la question nouvelle une clé à elle (« - clé : … »)`,
      );
    cles.set(it.key, rang);
  });
  const sortie = { ...ex, id, bloc, type: TYPE_ASSEMBLAGE, level: 1, programme: mission.programme, items: items_ };
  delete sortie.biome;
  return Object.fromEntries(ORDRE_QUESTIONS.filter((k) => sortie[k] !== undefined).map((k) => [k, sortie[k]]));
}

/** Le module TypeScript produit (src/blocland/world/recettes.ts). */
export function ecrireRecettes(assemblage) {
  return (
    "// Produit par `npm run contenu` depuis docs/contenu/assemblage.md : ne pas éditer.\n" +
    "import type { Assemblage } from './assemblage';\n\n" +
    `export const ASSEMBLAGE = ${JSON.stringify(assemblage, null, 2)} satisfies Assemblage;\n`
  );
}
