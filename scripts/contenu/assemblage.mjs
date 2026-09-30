// L'assemblage des blocs (fiche GD-2), écrit en Markdown dans docs/contenu/assemblage.md : le nom du lieu où l'on assemble
// dans chaque univers, et les blocs assemblés (leur archipel, leur recette, leur nom dans chaque univers). Il redonne
// src/blocland/world/recettes.ts ; le dessin des blocs (couleurs, textures) et du lieu reste dans le code.
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

/** Le module TypeScript produit (src/blocland/world/recettes.ts). */
export function ecrireRecettes(assemblage) {
  return (
    "// Produit par `npm run contenu` depuis docs/contenu/assemblage.md : ne pas éditer.\n" +
    "import type { Assemblage } from './assemblage';\n\n" +
    `export const ASSEMBLAGE = ${JSON.stringify(assemblage, null, 2)} satisfies Assemblage;\n`
  );
}
