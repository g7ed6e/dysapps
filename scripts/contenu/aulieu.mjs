// Les items du lieu d'un univers à monde ouvert (docs/univers/univers.md, § 4.2, règle « à l'essai »), écrits à la fin
// du Markdown d'une île (docs/contenu/<île>.md), sous « ## Au lieu · <univers> », avant « ## La voix », « ## Les plans »
// et « ## Les demandes ». Chaque item est le jumeau d'un item de référence du même niveau (« jumeau : 3 », le rang de
// l'item de référence) et en porte la clé : même point travaillé, mêmes sortes de pièges, même règle, autant de choix.
// npm run contenu les range dans src/game/world/continu/placeItems.json, que seul le monde ouvert lit : les JSON des
// exercices de référence n'en savent rien, Blocland non plus.
//
//   ## Au lieu · Archipéo
//
//   ### Niveau 1 · `french-6e-grammar-spelling-plurals-1`
//
//   Pour tous les items :
//   - trou lu : (mot manquant)
//
//   1. jumeau : 1
//      - scène : sardines · 3
//      - énoncé : Les sardines … brillent dans le filet.
//      - choix : gris · grise · grises
//      - réponse : grises
//      - point : adjectif féminin pluriel
//      - pièges : accord oublié · pluriel oublié
//      - indice : …
//      - explication : …
import { lireTexte } from './texte.mjs';

/** Le début de la section : « ## Au lieu · <univers> ». */
export const DEBUT_AU_LIEU = '## Au lieu · ';

/** Les univers à monde ouvert, par leur nom écrit : leur identifiant. */
const UNIVERS = { Archipéo: 'archipeo' };

/** Ce que le monde ouvert sait poser dans la scène des Filets : ce qui est dans le filet ou à côté. */
export const SCENES = ['sardines', 'filets', 'mouette', 'journaux', 'crabes', 'pêche', 'seaux', 'crabe'];

/** Les champs d'un item du lieu : [étiquette, clé dans le JSON, type]. */
const CHAMPS = [
  ['énoncé', 'prompt', 'texte'],
  ['choix', 'choices', 'liste'],
  ['réponse', 'answer', 'texte'],
  ['point', 'point', 'texte'],
  ['pièges', 'traps', 'liste'],
  ['indice', 'hint', 'texte'],
  ['explication', 'explanation', 'texte'],
];
const PAR_ETIQUETTE = new Map(CHAMPS.map((c) => [c[0], c]));
const OBLIGATOIRES = ['scene', 'prompt', 'choices', 'answer', 'point', 'traps', 'hint', 'explanation'];

/**
 * Lit la section « ## Au lieu · <univers> » : `lignes` commence à son titre, `debut` est le rang de ce titre dans le
 * fichier. Rend { univers, niveaux: [{ id, items: [{ jumeau, scene, prompt, spoken, choices, … }] }] } ; les clés se
 * résolvent ensuite contre les niveaux de référence (`resoudreAuLieu`).
 */
export function lireAuLieu(lignes, debut, fichier) {
  let i = 0;
  const erreur = (m) => new Error(`${fichier}, ligne ${debut + i + 1} : ${m}`);
  const nom = lignes[0].slice(DEBUT_AU_LIEU.length).trim();
  const univers = UNIVERS[nom];
  if (!univers) throw erreur(`univers à monde ouvert inconnu « ${nom} » (${Object.keys(UNIVERS).join(', ')})`);
  const niveaux = [];
  let niveau = null;
  let item = null;
  let pourTous = false;
  const texte = (v) => {
    try {
      return lireTexte(v, debut + i + 1);
    } catch (e) {
      throw new Error(`${fichier}, ${e.message}`);
    }
  };
  const champ = (brut) => {
    const m = /^(.+?) : (.+)$/.exec(brut);
    if (!m) throw erreur(`« étiquette : valeur » attendu, lu « ${brut} »`);
    const [, etiquette, valeur] = m;
    if (etiquette === 'scène') {
      if (item.scene) throw erreur('« scène » écrite deux fois');
      const s = /^(\S+) · (\d+)$/.exec(valeur);
      if (!s || !SCENES.includes(s[1])) throw erreur(`scène attendue sous la forme « sardines · 3 » (${SCENES.join(', ')}), lu « ${valeur} »`);
      item.scene = { catch: s[1], count: Number(s[2]) };
      return;
    }
    const def = PAR_ETIQUETTE.get(etiquette);
    if (!def) throw erreur(`champ inconnu « ${etiquette} »`);
    const [, cle, type] = def;
    if (item[cle] !== undefined) throw erreur(`« ${etiquette} » écrit deux fois`);
    item[cle] = type === 'liste' ? valeur.split(' · ').map(texte) : texte(valeur);
  };
  const finirNiveau = () => {
    if (!niveau) return;
    if (niveau.items.length === 0) throw erreur(`le niveau ${niveau.id} n’a aucun item du lieu`);
    for (const [n, it] of niveau.items.entries()) {
      for (const k of OBLIGATOIRES) if (it[k] === undefined) throw new Error(`${fichier}, ${niveau.id}, item du lieu ${n + 1} : « ${k === 'scene' ? 'scène' : CHAMPS.find((c) => c[1] === k)[0]} » manque`);
      if (!it.choices.includes(it.answer)) throw new Error(`${fichier}, ${niveau.id}, item du lieu ${n + 1} : la réponse n’est pas dans les choix`);
      if (new Set(it.choices).size !== it.choices.length) throw new Error(`${fichier}, ${niveau.id}, item du lieu ${n + 1} : un choix est écrit deux fois`);
      // Le trou se lit, comme dans la référence : jamais « … » dans le texte lu.
      it.spoken = niveau.trou === undefined ? it.prompt : it.prompt.replace('…', niveau.trou);
      if (it.spoken.includes('…')) throw new Error(`${fichier}, ${niveau.id}, item du lieu ${n + 1} : « … » resterait dans le texte lu ; écrire « trou lu » pour tous les items`);
    }
    niveaux.push({ id: niveau.id, items: niveau.items });
    niveau = null;
  };
  for (i = 1; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.trim() === '') {
      pourTous = false;
      continue;
    }
    if (l.startsWith('> ')) continue;
    let m;
    if ((m = /^### Niveau \d+ · `([a-z0-9-]+)`$/.exec(l))) {
      finirNiveau();
      if (niveaux.some((n) => n.id === m[1])) throw erreur(`niveau « ${m[1]} » écrit deux fois`);
      niveau = { id: m[1], items: [], trou: undefined };
      item = null;
      continue;
    }
    if (!niveau) throw erreur(`un niveau (« ### Niveau 1 · \`id\` ») est attendu, lu « ${l} »`);
    if (l === 'Pour tous les items :') {
      if (niveau.items.length) throw erreur('« Pour tous les items » va avant le premier item');
      pourTous = true;
      continue;
    }
    if (pourTous && (m = /^- trou lu : (.+)$/.exec(l))) {
      niveau.trou = texte(m[1]);
      continue;
    }
    if ((m = /^(\d+)\. jumeau : (\d+)$/.exec(l))) {
      if (Number(m[1]) !== niveau.items.length + 1) throw erreur(`item ${niveau.items.length + 1} attendu, lu ${m[1]}`);
      item = { jumeau: Number(m[2]) };
      niveau.items.push(item);
      pourTous = false;
      continue;
    }
    if (item && (m = /^ {3,4}- (.*)$/.exec(l))) {
      champ(m[1]);
      continue;
    }
    throw erreur(`ligne inattendue : ${l}`);
  }
  finirNiveau();
  return { univers, niveaux };
}

/**
 * Les items du lieu d'une île, rattachés à leurs jumeaux : chaque niveau doit être un niveau de l'île, chaque jumeau un
 * de ses items (une seule fois), avec autant de choix. Rend { [exerciceId]: items }, chaque item avec la clé de son jumeau.
 */
export function resoudreAuLieu(auLieu, exercices, fichier) {
  const sortie = {};
  for (const niveau of auLieu.niveaux) {
    const ex = exercices.find((e) => e.id === niveau.id);
    if (!ex) throw new Error(`${fichier}, « ${DEBUT_AU_LIEU.trim()} » : le niveau ${niveau.id} n’est pas un niveau de l’île`);
    const vus = new Set();
    sortie[niveau.id] = niveau.items.map((it, n) => {
      const ref = ex.items[it.jumeau - 1];
      const ou = `${fichier}, ${niveau.id}, item du lieu ${n + 1}`;
      if (!ref) throw new Error(`${ou} : le jumeau ${it.jumeau} n’existe pas (le niveau a ${ex.items.length} items)`);
      if (vus.has(ref.key)) throw new Error(`${ou} : le jumeau ${it.jumeau} a déjà un item du lieu`);
      vus.add(ref.key);
      if (!Array.isArray(ref.choices) || ref.choices.length !== it.choices.length) throw new Error(`${ou} : autant de choix que le jumeau (${ref.choices?.length ?? 0})`);
      const { jumeau: _rang, ...champs } = it;
      return { key: ref.key, ...champs };
    });
  }
  return sortie;
}
