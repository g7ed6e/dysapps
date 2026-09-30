// Les missions du portail écrites en Markdown (docs/contenu/portail/<mission>.md) : homophones, verbes irréguliers,
// textes à lire, vocabulaire anglais. Chaque fichier redonne un JSON du jeu (src/apps/<mission>/…json), à l'identique.
// Le format est strict, comme celui des îles (format.mjs) : une ligne inconnue arrête la génération, avec son numéro.
import { aGuillemets, ecrireTexte, lireTexte } from './texte.mjs';

const SEP = ' · ';

/** Les missions du portail : le fichier Markdown, le JSON produit, et leur format. */
export const MISSIONS_PORTAIL = [
  { id: 'homophones', json: 'src/apps/homophones/sets.json', lire: avecFichier(lireHomophones), ecrire: ecrireHomophones },
  { id: 'verbes-irreguliers', json: 'src/apps/irreguliers/verbs.json', lire: avecFichier(lireVerbes), ecrire: ecrireVerbes },
  { id: 'lecture', json: 'src/apps/lecture/texts.json', lire: avecFichier(lireLecture), ecrire: ecrireLecture },
  { id: 'vocabulaire', json: 'src/apps/vocabulaire/themes.json', lire: avecFichier(lireVocabulaire), ecrire: ecrireVocabulaire },
];

/** Préfixe du nom du fichier les erreurs qui ne le disent pas (celles de lireTexte ne donnent que la ligne). */
function avecFichier(lire) {
  return (md, fichier) => {
    try {
      return lire(md, fichier);
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith(`${fichier},`)) e.message = `${fichier}, ${e.message}`;
      throw e;
    }
  };
}

// ---------- Outils communs ----------

/** Une case de tableau ou une valeur de liste : jamais de « | » ni de « · », sinon le format ne sait pas la relire. */
function enLigne(s, ou) {
  if (typeof s !== 'string' || s.includes('|') || s.includes('·') || /[\n\r]/.test(s)) throw new Error(`${ou} : « ${s} » ne tient pas dans une case (ni « | », ni « · », ni saut de ligne)`);
  return ecrireTexte(s);
}

function liste(valeurs, ou) {
  return valeurs.map((v) => enLigne(v, ou)).join(SEP);
}

function rangee(cases) {
  return `| ${cases.join(' | ')} |`;
}

function tableau(entetes, lignes) {
  return [rangee(entetes), rangee(entetes.map(() => '---')), ...lignes.map(rangee)];
}

/** Un lecteur de lignes : position, erreurs avec le numéro de ligne, et les formes communes. */
class Lecteur {
  constructor(md, fichier, portail) {
    this.lignes = md.replace(/^\uFEFF/, '').split(/\r?\n/);
    this.fichier = fichier;
    this.ids = new Set();
    this.i = 0;
    if (this.lignes[0] !== '---' || this.lignes[1] !== `portail : ${portail}` || this.lignes[2] !== '---') {
      throw this.erreur(`l’en-tête attendu est « --- / portail : ${portail} / --- »`);
    }
    this.i = 3;
  }

  erreur(m) {
    return new Error(`${this.fichier}, ligne ${this.i + 1} : ${m}`);
  }

  /** Passe les lignes vides et les notes « > » ; rend la ligne suivante sans l'avancer (undefined à la fin). */
  voir() {
    while (this.i < this.lignes.length && (this.lignes[this.i].trim() === '' || this.lignes[this.i].startsWith('> '))) this.i++;
    return this.lignes[this.i];
  }

  prendre() {
    const l = this.voir();
    this.i++;
    return l;
  }

  titre() {
    const l = this.prendre();
    if (!l?.startsWith('# ')) throw this.erreur('le titre « # … » est attendu');
  }

  /** « ## Libellé · `id` » ou undefined à la fin du fichier. */
  section() {
    const l = this.voir();
    if (l === undefined) return undefined;
    const m = /^## (.+) · `([a-z0-9-]+)`$/.exec(l);
    if (!m) throw this.erreur(`« ## Libellé · \`id\` » attendu, lu « ${l} »`);
    if (this.ids.has(m[2])) throw this.erreur(`l’identifiant « ${m[2]} » est écrit deux fois`);
    this.ids.add(m[2]);
    this.i++;
    return { libelle: lireTexte(m[1], this.i), id: m[2] };
  }

  /** Les champs « - étiquette : valeur » qui suivent, dans l'ordre : [[étiquette, valeur brute, ligne]]. */
  champs() {
    const sortie = [];
    let l;
    while ((l = this.voir()) !== undefined && l.startsWith('- ')) {
      const m = /^- (.+?) : (.*)$/.exec(l);
      if (!m) throw this.erreur(`« - étiquette : valeur » attendu, lu « ${l} »`);
      sortie.push([m[1], m[2], this.i + 1]);
      this.i++;
    }
    return sortie;
  }

  /** Un tableau aux colonnes attendues : ses rangées, en cases (chaînes, vides comprises). */
  tableau(entetes) {
    const cases = (l) => {
      if (!l?.startsWith('|') || !l.endsWith('|') || l.length < 2) throw this.erreur(`ligne de tableau attendue, lu « ${l} »`);
      return l.slice(1, -1).split('|').map((c) => c.trim());
    };
    const tete = cases(this.prendre());
    if (tete.join('|') !== entetes.join('|')) throw this.erreur(`colonnes attendues : ${entetes.join(', ')}`);
    const sep = cases(this.lignes[this.i]);
    if (sep.length !== entetes.length || !sep.every((c) => /^:?-+:?$/.test(c))) throw this.erreur('ligne « |---|---| » attendue');
    this.i++;
    const rangees = [];
    while (this.lignes[this.i]?.startsWith('|')) {
      const r = cases(this.lignes[this.i]);
      if (r.length !== entetes.length) throw this.erreur(`${entetes.length} cases attendues, lu ${r.length}`);
      rangees.push(r.map((c) => ({ brut: c, ligne: this.i + 1 })));
      this.i++;
    }
    return rangees;
  }
}

/** Les champs lus, rangés par étiquette ; refuse un champ inconnu, écrit deux fois ou manquant. */
function ranger(champs, connus, obligatoires, lecteur) {
  const sortie = {};
  for (const [etiquette, brut, ligne] of champs) {
    if (!connus.includes(etiquette)) throw new Error(`${lecteur.fichier}, ligne ${ligne} : champ inconnu « ${etiquette} »`);
    if (Object.hasOwn(sortie, etiquette)) throw new Error(`${lecteur.fichier}, ligne ${ligne} : « ${etiquette} » écrit deux fois`);
    sortie[etiquette] = { brut, ligne };
  }
  for (const e of obligatoires) if (!Object.hasOwn(sortie, e)) throw lecteur.erreur(`« ${e} » manque`);
  return sortie;
}

const texte = (c) => lireTexte(c.brut, c.ligne);
const valeurs = (c) => c.brut.split(SEP).map((v) => lireTexte(v, c.ligne));
/** Un entier positif (niveau, rang d'une ligne) : les décimaux de format.mjs n'ont pas cours ici. */
function nombre(c, lecteur) {
  if (!/^\d+$/.test(c.brut)) throw new Error(`${lecteur.fichier}, ligne ${c.ligne} : nombre attendu, lu « ${c.brut} »`);
  return Number(c.brut);
}

function entete(portail, titre) {
  return ['---', `portail : ${portail}`, '---', '', `# ${titre}`, ''];
}

// ---------- Homophones ----------

function ecrireHomophones(sets) {
  const lignes = entete('homophones', 'Homophones');
  for (const s of sets) {
    const ou = `homophones, ${s.id}`;
    lignes.push(`## ${ecrireTexte(s.label)} · \`${s.id}\``, '', `- niveau : ${s.level}`, `- choix : ${liste(s.choices, ou)}`, `- indice : ${ecrireTexte(s.hint)}`);
    for (const [mot, regle] of Object.entries(s.rules)) lignes.push(`- règle « ${mot} » : ${ecrireTexte(regle)}`);
    lignes.push('', ...tableau(['phrase', 'réponse'], s.sentences.map((p) => [enLigne(p.text, ou), enLigne(p.answer, ou)])), '');
  }
  return lignes.join('\n');
}

function lireHomophones(md, fichier) {
  const l = new Lecteur(md, fichier, 'homophones');
  l.titre();
  const sets = [];
  let s;
  while ((s = l.section())) {
    const champs = l.champs();
    const regles = champs.filter(([e]) => /^règle « .+ »$/.test(e));
    const c = ranger(champs.filter((x) => !regles.includes(x)), ['niveau', 'choix', 'indice'], ['niveau', 'choix', 'indice'], l);
    const rules = {};
    for (const [e, brut, ligne] of regles) {
      const mot = e.slice('règle « '.length, -' »'.length);
      if (Object.hasOwn(rules, mot)) throw new Error(`${fichier}, ligne ${ligne} : « ${e} » écrit deux fois`);
      rules[mot] = lireTexte(brut, ligne);
    }
    const sentences = l.tableau(['phrase', 'réponse']).map(([p, r]) => ({ text: texte(p), answer: texte(r) }));
    sets.push({ id: s.id, level: nombre(c.niveau, l), label: s.libelle, choices: valeurs(c.choix), hint: texte(c.indice), rules, sentences });
  }
  return sets;
}

// ---------- Verbes irréguliers ----------

const COLONNES_VERBES = ['base', 'prétérit', 'participe', 'français', 'niveau', 'pièges', 'piège régularisé'];

function ecrireVerbes(verbes) {
  const lignes = entete('verbes-irreguliers', 'Verbes irréguliers');
  const rangees = verbes.map((v) => {
    const ou = `verbes, ${v.base}`;
    const r = [enLigne(v.base, ou), enLigne(v.preterit, ou), enLigne(v.participle, ou), enLigne(v.fr, ou), String(v.level)];
    r.push(v.traps ? liste(v.traps, ou) : '', v.regular === undefined ? '' : v.regular ? 'oui' : 'non');
    return r;
  });
  return [...lignes, ...tableau(COLONNES_VERBES, rangees), ''].join('\n');
}

function lireVerbes(md, fichier) {
  const l = new Lecteur(md, fichier, 'verbes-irreguliers');
  l.titre();
  const vus = new Set();
  const verbes = l.tableau(COLONNES_VERBES).map(([base, preterit, participle, fr, niveau, pieges, regulier]) => {
    if (vus.has(base.brut)) throw new Error(`${fichier}, ligne ${base.ligne} : le verbe « ${base.brut} » est écrit deux fois`);
    vus.add(base.brut);
    const v = { base: texte(base), preterit: texte(preterit), participle: texte(participle), fr: texte(fr), level: nombre(niveau, l) };
    if (pieges.brut !== '') v.traps = valeurs(pieges);
    if (regulier.brut !== '') {
      if (regulier.brut !== 'oui' && regulier.brut !== 'non') throw new Error(`${fichier}, ligne ${regulier.ligne} : « oui » ou « non » attendu`);
      v.regular = regulier.brut === 'oui';
    }
    return v;
  });
  if (l.voir() !== undefined) throw l.erreur(`ligne inattendue après le tableau : ${l.voir()}`);
  return verbes;
}

// ---------- Textes à lire ----------

/** Une ligne du texte telle quelle : rien qui puisse passer pour du format (titre, liste, note, tableau, espaces au bord). */
function ligneDeTexte(s, ou) {
  if (aGuillemets(s) || /^(#|- |> |\||\d+\. )/.test(s)) throw new Error(`${ou} : ligne de texte à revoir : « ${s} »`);
  return s;
}

function ecrireLecture(textes) {
  const lignes = entete('lecture', 'Textes à lire');
  for (const t of textes) {
    const ou = `lecture, ${t.id}`;
    lignes.push(`## ${ecrireTexte(t.title)} · \`${t.id}\``, '', `- auteur : ${ecrireTexte(t.author)}`, `- source : ${ecrireTexte(t.source)}`, `- forme : ${t.kind}`, '', '### Texte', '');
    for (const p of t.paragraphs) lignes.push(...p.map((x) => ligneDeTexte(x, ou)), '');
    lignes.push('### Glossaire', '', ...tableau(['mot', 'définition'], t.glossary.map((g) => [enLigne(g.word, ou), enLigne(g.definition, ou)])), '', '### Questions', '');
    t.questions.forEach((q, n) => {
      lignes.push(
        `${n + 1}. question : ${ecrireTexte(q.prompt)}`,
        `   - choix : ${liste(q.choices, ou)}`,
        `   - réponse : ${ecrireTexte(q.answer)}`,
        `   - lignes : ${q.lines[0] === q.lines[1] ? q.lines[0] : q.lines.join(SEP)}`,
        `   - explication : ${ecrireTexte(q.explanation)}`,
      );
    });
    lignes.push('');
  }
  return lignes.join('\n');
}

function lireLecture(md, fichier) {
  const l = new Lecteur(md, fichier, 'lecture');
  l.titre();
  const textes = [];
  let s;
  while ((s = l.section())) {
    const c = ranger(l.champs(), ['auteur', 'source', 'forme'], ['auteur', 'source', 'forme'], l);
    if (!['vers', 'prose'].includes(c.forme.brut)) throw new Error(`${fichier}, ligne ${c.forme.ligne} : « vers » ou « prose » attendu`);
    if (l.prendre() !== '### Texte') throw l.erreur('« ### Texte » attendu');
    // Le texte : un paragraphe par bloc de lignes, jusqu'à « ### Glossaire ».
    const paragraphs = [];
    let courant = null;
    for (; l.i < l.lignes.length && l.lignes[l.i] !== '### Glossaire'; l.i++) {
      const x = l.lignes[l.i];
      if (x.trim() === '') {
        courant = null;
        continue;
      }
      if (!courant) paragraphs.push((courant = []));
      courant.push(ligneDeTexte(x, `${fichier}, ligne ${l.i + 1}`));
    }
    if (l.prendre() !== '### Glossaire') throw l.erreur('« ### Glossaire » attendu');
    const glossary = l.tableau(['mot', 'définition']).map(([w, d]) => ({ word: texte(w), definition: texte(d) }));
    if (l.prendre() !== '### Questions') throw l.erreur('« ### Questions » attendu');
    const questions = [];
    while (/^\d+\. /.test(l.voir() ?? '')) {
      const tete = /^(\d+)\. question : (.*)$/.exec(l.voir());
      if (!tete || Number(tete[1]) !== questions.length + 1) throw l.erreur(`« ${questions.length + 1}. question : … » attendu`);
      const ligneQ = l.i + 1;
      l.i++;
      const champs = [];
      while (/^ {3}- /.test(l.lignes[l.i] ?? '')) {
        const m = /^ {3}- (.+?) : (.*)$/.exec(l.lignes[l.i]);
        if (!m) throw l.erreur(`« - étiquette : valeur » attendu, lu « ${l.lignes[l.i]} »`);
        champs.push([m[1], m[2], l.i + 1]);
        l.i++;
      }
      const q = ranger(champs, ['choix', 'réponse', 'lignes', 'explication'], ['choix', 'réponse', 'lignes', 'explication'], l);
      // « 6 » pour une seule phrase, « 5 · 13 » pour un passage : le rang du vers ou de la phrase dans tout le texte, depuis 1.
      const bornes = q.lignes.brut.split(SEP).map((n) => nombre({ brut: n, ligne: q.lignes.ligne }, l));
      if (bornes.length > 2 || bornes[0] > bornes.at(-1)) throw new Error(`${fichier}, ligne ${q.lignes.ligne} : « 6 » ou « 5 · 13 » attendu`);
      const lines = [bornes[0], bornes.at(-1)];
      questions.push({ prompt: lireTexte(tete[2], ligneQ), choices: valeurs(q.choix), answer: texte(q.réponse), lines, explanation: texte(q.explication) });
    }
    textes.push({ id: s.id, title: s.libelle, author: texte(c.auteur), source: texte(c.source), kind: c.forme.brut, paragraphs, glossary, questions });
  }
  return textes;
}

// ---------- Vocabulaire anglais ----------

function ecrireVocabulaire(themes) {
  const lignes = entete('vocabulaire', 'Vocabulaire anglais');
  for (const t of themes) {
    const ou = `vocabulaire, ${t.id}`;
    lignes.push(`## ${ecrireTexte(t.label)} · \`${t.id}\``, '', ...tableau(['anglais', 'français', 'pièges'], t.words.map((w) => [enLigne(w.en, ou), enLigne(w.fr, ou), liste(w.traps, ou)])), '');
  }
  return lignes.join('\n');
}

function lireVocabulaire(md, fichier) {
  const l = new Lecteur(md, fichier, 'vocabulaire');
  l.titre();
  const themes = [];
  let s;
  while ((s = l.section())) {
    const words = l.tableau(['anglais', 'français', 'pièges']).map(([en, fr, traps]) => ({ en: texte(en), fr: texte(fr), traps: valeurs(traps) }));
    themes.push({ id: s.id, label: s.libelle, words });
  }
  return themes;
}
