// « règle » : la seule ligne de la carte de règle de la référence que le lieu montre (la carte garde son titre ; elle
// reste entière dans « Vue simple ») ; elle doit être une ligne de la carte du jumeau.
//
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
//   - règle : Le nom commande : déterminant et adjectif prennent son genre et son nombre.
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
//
// La parole du lieu et la raison du lieu (GD-27, lot 2), dans la même section, avant les niveaux : ce que l'habitant dit
// quand on le touche hors de sa scénette (« ### L’habitant », une liste par registre : son métier, son lieu, puis l'état
// du lieu, la ruine, le chantier, le lieu rallumé ; deux à quatre lignes chacune, qui tournent à chaque toucher), et le
// cadre et la suite de chaque mission jouée dans la scénette (« ### Les missions », un tableau : le cadre, dit à l'entrée
// avant la première bulle ; la suite, dite au bilan après le résultat). Dix mots au plus par ligne, un point à la fin,
// des phrases littérales (ni « ! », ni « … », ni chiffre, ni verbe figuré, ni mot d'équipe), le cadre sans attente ni
// manque (règles du référent dys et du consultant d'Archipéo, GD-27). npm run contenu les range dans
// src/game/world/continu/paroles.json.
//
//   ### L’habitant
//
//   - métier : Je sale la morue. · Je ratisse le sel.
//   - lieu : Ici, l’eau de mer devient du sel. · Le vent sèche les bassins.
//   - ruine : Le sable a rempli les bassins. · Les planches sont tombées.
//   - chantier : Les bassins sont dégagés. · Le toit de la cabane est posé.
//   - rallumé : Le sel sèche au soleil. · Les sacs sont pleins.
//
//   ### Les missions
//
//   | mission | cadre | suite |
//   | --- | --- | --- |
//   | `plurals` | Le bateau prend le sel. | Le sel est prêt. |
import { lireTexte, motsDe } from './texte.mjs';

/** Le début de la section : « ## Au lieu · <univers> ». */
export const DEBUT_AU_LIEU = '## Au lieu · ';

/** Les univers à monde ouvert, par leur nom écrit : leur identifiant. */
const UNIVERS = { Archipéo: 'archipeo' };

/** Ce que le monde ouvert sait poser dans la scène des Filets : ce qui est dans le filet ou à côté. */
export const SCENES = ['sardines', 'filets', 'mouette', 'bocaux', 'crabes', 'pêche', 'seaux', 'crabe'];

/** Les registres de la parole de l'habitant : [étiquette, clé dans le JSON]. L'état du lieu : la ruine, le chantier, rallumé. */
export const REGISTRES = [
  ['métier', 'metier'],
  ['lieu', 'lieu'],
  ['ruine', 'ruine'],
  ['chantier', 'chantier'],
  ['rallumé', 'rallume'],
];
const PAR_REGISTRE = new Map(REGISTRES.map((r) => [r[0], r[1]]));
/** Le plafond d'une ligne de parole, en mots (GD-27). */
export const MOTS_PAROLE = 10;
/** Lignes par registre : au moins deux (elles tournent), quatre au plus. */
const LIGNES_PAR_REGISTRE = { min: 2, max: 4 };
/** Les mots d'équipe, jamais dans la bouche d'un habitant (GD-19, GD-27). */
const MOTS_INTERDITS = /\b(rafiots?|zeppelins?|veill[ée]es?|ruines?|ferrailleurs?|pi[èe]ce ma[îi]tresse|c[œo]eur du lieu|vite|merci|qu[êe]tes?)\b/iu;
/** Les verbes figurés les plus courants (référent dys) : un verbe concret, jamais d'image. */
const VERBES_FIGURES = /\b(apprivois|dompt|réveill|dévor|endor)\p{L}*/iu;
/** Dans un cadre : ni attente, ni urgence, ni manque (référent dys). */
const PRESSION = /\b(attend\p{L}*|vite|manqu\p{L}*|il faut|dépêch\p{L}*|urgen\p{L}*|retard\p{L}*)\b/iu;

/**
 * Une ligne de parole (une ligne de l'habitant, un cadre, une suite) suit les règles de GD-27 : dix mots au plus, un
 * point à la fin, littérale (ni « ! », « ? », « … », « ; », ni chiffre, ni verbe figuré, ni mot d'équipe) ; un cadre sans
 * attente ni manque. Lance avec `ou` en tête du message.
 */
export function verifierParole(texte, ou, cadre = false) {
  const n = motsDe(texte);
  if (n > MOTS_PAROLE) throw new Error(`${ou} : « ${texte} » a ${n} mots, ${MOTS_PAROLE} au plus`);
  if (!texte.endsWith('.')) throw new Error(`${ou} : « ${texte} » finit par un point`);
  if (/[!?…;]/.test(texte)) throw new Error(`${ou} : « ${texte} » : ni « ! », ni « ? », ni « … », ni « ; »`);
  if (/\d/.test(texte)) throw new Error(`${ou} : « ${texte} » : un nombre s’écrit en lettres`);
  let m;
  if ((m = MOTS_INTERDITS.exec(texte))) throw new Error(`${ou} : « ${texte} » : « ${m[0]} » ne se dit pas à l’élève`);
  if ((m = VERBES_FIGURES.exec(texte))) throw new Error(`${ou} : « ${texte} » : « ${m[0]} » est figuré, un verbe concret`);
  if (cadre && (m = PRESSION.exec(texte))) throw new Error(`${ou} : le cadre « ${texte} » : « ${m[0]} », ni attente, ni urgence, ni manque`);
}

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
  // La parole du lieu et la raison du lieu (GD-27) : `habitant`, les lignes par registre ; `missions`, le cadre et la
  // suite par mission ; `mode`, la sous-section en cours.
  let habitant = null;
  let missions = null;
  let mode = null;
  let enTete = false;
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
      if (niveau.regle !== undefined) it.rule = niveau.regle;
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
    if (l === '### L’habitant' || l === '### Les missions') {
      finirNiveau();
      if (niveaux.length) throw erreur(`« ${l} » va avant les niveaux`);
      if (l === '### L’habitant') {
        if (habitant) throw erreur('« ### L’habitant » écrit deux fois');
        habitant = {};
        mode = 'habitant';
      } else {
        if (missions) throw erreur('« ### Les missions » écrit deux fois');
        missions = {};
        mode = 'missions';
        enTete = true;
      }
      continue;
    }
    if (mode === 'habitant' && (m = /^- (.+?) : (.+)$/.exec(l))) {
      const cle = PAR_REGISTRE.get(m[1]);
      if (!cle) throw erreur(`registre inconnu « ${m[1]} » (${REGISTRES.map((r) => r[0]).join(', ')})`);
      if (habitant[cle]) throw erreur(`« ${m[1]} » écrit deux fois`);
      const lignes = m[2].split(' · ').map(texte);
      if (lignes.length < LIGNES_PAR_REGISTRE.min || lignes.length > LIGNES_PAR_REGISTRE.max) throw erreur(`« ${m[1]} » : de ${LIGNES_PAR_REGISTRE.min} à ${LIGNES_PAR_REGISTRE.max} lignes, lu ${lignes.length}`);
      for (const ligne of lignes) verifierParole(ligne, `${fichier}, ligne ${debut + i + 1}`);
      habitant[cle] = lignes;
      continue;
    }
    if (mode === 'missions' && l.startsWith('|')) {
      const cases = l.split('|').slice(1, -1).map((c) => c.trim());
      if (enTete) {
        if (cases.join('|') !== 'mission|cadre|suite') throw erreur('en-tête attendu : « | mission | cadre | suite | »');
        enTete = false;
        continue;
      }
      if (cases.every((c) => /^-+$/.test(c))) continue;
      if (cases.length !== 3) throw erreur(`trois colonnes attendues (mission, cadre, suite), lu ${cases.length}`);
      const id = /^`([a-z0-9-]+)`$/.exec(cases[0])?.[1];
      if (!id) throw erreur(`identifiant de mission attendu entre accents graves, lu « ${cases[0]} »`);
      if (missions[id]) throw erreur(`mission « ${id} » écrite deux fois`);
      const ou = `${fichier}, ligne ${debut + i + 1}`;
      const frame = texte(cases[1]);
      const follow = texte(cases[2]);
      verifierParole(frame, ou, true);
      verifierParole(follow, ou);
      missions[id] = { frame, follow };
      continue;
    }
    if ((m = /^### Niveau \d+ · `([a-z0-9-]+)`$/.exec(l))) {
      mode = 'niveau';
      finirNiveau();
      if (niveaux.some((n) => n.id === m[1])) throw erreur(`niveau « ${m[1]} » écrit deux fois`);
      niveau = { id: m[1], items: [], trou: undefined, regle: undefined };
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
    if (pourTous && (m = /^- règle : (.+)$/.exec(l))) {
      niveau.regle = texte(m[1]);
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
  if (habitant) for (const [etiquette, cle] of REGISTRES) if (!habitant[cle]) throw new Error(`${fichier}, « ### L’habitant » : « ${etiquette} » manque`);
  return { univers, niveaux, habitant, missions };
}

/**
 * La parole du lieu d'une île (GD-27), rattachée à ses missions : chaque mission du tableau est une mission de l'île.
 * Rend { lines, missions } (ou null quand l'île n'en écrit pas), pour src/game/world/continu/paroles.json.
 */
export function resoudreParoles(auLieu, missions, fichier) {
  if (!auLieu.habitant && !auLieu.missions) return null;
  const ids = new Set(missions.map((m) => m.id));
  for (const id of Object.keys(auLieu.missions ?? {})) if (!ids.has(id)) throw new Error(`${fichier}, « ### Les missions » : « ${id} » n’est pas une mission de l’île`);
  return { ...(auLieu.habitant ? { lines: auLieu.habitant } : {}), ...(auLieu.missions ? { missions: auLieu.missions } : {}) };
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
      if (it.rule !== undefined && !(ref.aid?.kind === 'rule-card' && ref.aid.props?.lines?.includes(it.rule)))
        throw new Error(`${ou} : la règle « ${it.rule} » n’est pas une ligne de la carte de règle du jumeau`);
      const { jumeau: _rang, ...champs } = it;
      return { key: ref.key, ...champs };
    });
  }
  return sortie;
}
