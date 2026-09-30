// Le format Markdown du contenu (docs/contenu/<île>.md) : une île par fichier, un niveau d'exercice par section.
// lireIle(md) rend les exercices (les objets des JSON du jeu), ecrireIle(ile, exercices) écrit le Markdown.
// Le format est strict : un champ inconnu ou mal écrit arrête la génération, avec le numéro de ligne.
//
//   ---
//   île : baie
//   ---
//   # Baie …                                 ← titre libre
//   ## Écoute · `ears`                       ← une mission : son titre et son identifiant
//   - consigne : Écoute le mot anglais, …    ← champs communs à tous ses niveaux
//   ### Niveau 1 · `baie-ears-1`             ← un niveau : l'identifiant de l'exercice
//   - langue : en                            ← champs propres à ce niveau
//   Aide « Se présenter », pour tous les items :
//   - Hello / Hi = bonjour.
//   1. mot : cat                             ← un item par numéro, son premier champ sur la ligne
//      - choix : le chat · le chien · la vache
//
// Une valeur qui a un saut de ligne, des espaces au bord, qui est vide ou qui commence par « " »
// s'écrit comme une chaîne JSON entre guillemets. Une liste s'écrit « a · b · c », ou en sous-liste si un élément
// contient « · ».

/** Champs d'un niveau, dans l'ordre d'écriture : [étiquette, chemin dans le JSON, type]. */
const NIVEAU = [
  ['titre', 'title', 'texte'],
  ['langue', 'lang', 'texte'],
  ['cible', 'target', 'texte'],
  ['consigne', 'instruction', 'texte'],
  ['programme', 'programme', 'liste'],
  ['par partie', 'perRun', 'nombre'],
  ['bravo', 'feedback.correct', 'texte'],
  ['erreur', 'feedback.wrong', 'texte'],
  ['bloc gagné', 'reward.block', 'texte'],
  ['blocs', 'reward.amount', 'nombre'],
  ['XP', 'reward.xp', 'nombre'],
  ['monte à', 'adaptive.promoteAt', 'nombre'],
  ['descend à', 'adaptive.demoteAt', 'nombre'],
];

/** Champs d'un item : [étiquette, clé dans le JSON, type]. */
const ITEM = [
  ['clé', 'key', 'texte'],
  ['texte', 'text', 'texte'],
  ['énoncé', 'prompt', 'texte'],
  ['question', 'question', 'texte'],
  ['phrase', 'sentence', 'texte'],
  ['mot', 'word', 'texte'],
  ['lettre', 'letter', 'texte'],
  ['racine', 'root', 'texte'],
  ['sujet', 'subject', 'texte'],
  ['singulier', 'singular', 'texte'],
  ['pluriel', 'plural', 'texte'],
  ['avant', 'before', 'texte'],
  ['après', 'after', 'texte'],
  ['case', 'slot', 'texte'],
  ['terminaison', 'ending', 'texte'],
  ['cible', 'target', 'texte'],
  ['image', 'image', 'texte'],
  ['lu', 'spoken', 'texte'],
  ['entendu', 'heard', 'texte'],
  ['choix', 'choices', 'liste'],
  ['langue des choix', 'choicesLang', 'texte'],
  ['réponse', 'answer', 'texte'],
  ['juste', 'correct', 'oui-non'],
  ['sens', 'meaning', 'texte'],
  ['règle', 'rule', 'texte'],
  ['indice', 'hint', 'texte'],
  ['astuce', 'tip', 'texte'],
  ['explication', 'explanation', 'texte'],
  ['pourquoi', 'why', 'texte'],
];

const PAR_ETIQUETTE_NIVEAU = new Map(NIVEAU.map((c) => [c[0], c]));
const PAR_ETIQUETTE_ITEM = new Map(ITEM.map((c) => [c[0], c]));
const PAR_CLE_ITEM = new Map(ITEM.map((c) => [c[1], c]));
const SEP = ' · ';

// ---------- Valeurs ----------

function aGuillemets(s) {
  return s === '' || s !== s.trim() || /[\n\r]/.test(s) || s.startsWith('"');
}

function ecrireTexte(s) {
  return aGuillemets(s) ? JSON.stringify(s) : s;
}

function lireTexte(v, ligne) {
  if (v.startsWith('"')) {
    try {
      const s = JSON.parse(v);
      if (typeof s === 'string') return s;
    } catch {}
    throw new Error(`ligne ${ligne} : chaîne entre guillemets mal écrite : ${v}`);
  }
  return v;
}

function lireValeur(type, v, ligne) {
  if (type === 'nombre') {
    const n = Number(v);
    if (v === '' || !Number.isFinite(n)) throw new Error(`ligne ${ligne} : nombre attendu, lu « ${v} »`);
    return n;
  }
  if (type === 'oui-non') {
    if (v === 'oui') return true;
    if (v === 'non') return false;
    throw new Error(`ligne ${ligne} : « oui » ou « non » attendu, lu « ${v} »`);
  }
  if (type === 'liste') return v === '' ? null : v.split(SEP).map((x) => lireTexte(x, ligne));
  return lireTexte(v, ligne);
}

/** Les lignes d'un champ : « - étiquette : valeur », ou une sous-liste pour une liste qui ne tient pas en ligne. */
function ecrireChamp(etiquette, type, valeur, retrait) {
  if (type === 'nombre') return [`${retrait}- ${etiquette} : ${valeur}`];
  if (type === 'oui-non') return [`${retrait}- ${etiquette} : ${valeur ? 'oui' : 'non'}`];
  if (type === 'liste') {
    const enLigne = valeur.length > 0 && valeur.every((x) => !x.includes('·') && !aGuillemets(x));
    if (enLigne) return [`${retrait}- ${etiquette} : ${valeur.join(SEP)}`];
    return [`${retrait}- ${etiquette} :`, ...valeur.map((x) => `${retrait}  - ${ecrireTexte(x)}`)];
  }
  return [`${retrait}- ${etiquette} : ${ecrireTexte(valeur)}`];
}

function obtenir(objet, chemin) {
  return chemin.split('.').reduce((o, k) => (o == null ? undefined : o[k]), objet);
}

function poser(objet, chemin, valeur) {
  const cles = chemin.split('.');
  let o = objet;
  for (const k of cles.slice(0, -1)) o = o[k] ??= {};
  o[cles.at(-1)] = valeur;
}

// ---------- Écriture ----------

function ecrireAide(aide, entete, retrait) {
  if (aide.kind !== 'rule-card' || Object.keys(aide).join() !== 'kind,props' || Object.keys(aide.props).join() !== 'title,lines') {
    throw new Error(`aide non prise en charge : ${JSON.stringify(aide)}`);
  }
  return [`${retrait}${entete.replace('%', ecrireTexte(aide.props.title))}`, ...aide.props.lines.map((l) => `${retrait}  - ${ecrireTexte(l)}`)];
}

function verifierCles(objet, attendues, ou) {
  for (const k of Object.keys(objet)) if (!attendues.has(k)) throw new Error(`${ou} : champ inconnu « ${k} » (à ajouter à scripts/contenu/format.mjs)`);
}

const CLES_NIVEAU = new Set(['id', 'biome', 'type', 'level', 'items', 'feedback', 'reward', 'adaptive', ...NIVEAU.map((c) => c[1].split('.')[0])]);

/**
 * Écrit le Markdown d'une île. `ile` = { id, nom, missions: [{ id, titre }] } (les missions sans exercice sont
 * omises ; un type d'exercice absent de la liste devient une mission à son nom). Les champs identiques pour tous
 * les niveaux d'une mission s'écrivent une fois, sous le titre de la mission.
 */
export function ecrireIle(ile, exercices) {
  const lignes = ['---', `île : ${ile.id}`, '---', '', `# ${ile.nom ?? ile.id}`, ''];
  const missions = [...(ile.missions ?? [])];
  for (const ex of exercices) {
    verifierCles(ex, CLES_NIVEAU, ex.id);
    if (ex.biome !== ile.id) throw new Error(`${ex.id} : île ${ex.biome}, attendue ${ile.id}`);
    if (!missions.some((m) => m.id === ex.type)) missions.push({ id: ex.type, titre: ex.type });
  }
  for (const mission of missions) {
    const niveaux = exercices.filter((ex) => ex.type === mission.id);
    if (niveaux.length === 0) continue;
    const communs = NIVEAU.filter(([, chemin]) => {
      const v = JSON.stringify(obtenir(niveaux[0], chemin));
      return v !== undefined && niveaux.every((ex) => JSON.stringify(obtenir(ex, chemin)) === v);
    });
    lignes.push(`## ${mission.titre} · \`${mission.id}\``, '');
    for (const [etiquette, chemin, type] of communs) lignes.push(...ecrireChamp(etiquette, type, obtenir(niveaux[0], chemin), ''));
    if (communs.length) lignes.push('');
    for (const ex of niveaux) {
      lignes.push(`### Niveau ${ex.level} · \`${ex.id}\``, '');
      let champs = 0;
      for (const def of NIVEAU) {
        const [etiquette, chemin, type] = def;
        const v = obtenir(ex, chemin);
        if (v !== undefined && !communs.includes(def)) {
          lignes.push(...ecrireChamp(etiquette, type, v, ''));
          champs++;
        }
      }
      const aides = ex.items.map((it) => JSON.stringify(it.aid));
      const aideCommune = ex.items.length > 1 && aides[0] !== undefined && aides.every((a) => a === aides[0]) ? ex.items[0].aid : null;
      if (aideCommune) {
        if (champs) lignes.push('');
        lignes.push(...ecrireAide(aideCommune, 'Aide « % », pour tous les items :', '').map((l) => l.replace(/^ {2}/, '')));
      }
      if (champs || aideCommune) lignes.push('');
      ex.items.forEach((it, i) => {
        const cles = Object.keys(it).filter((k) => !(k === 'key' && it.key === `${ex.id}-${i}`) && !(k === 'aid' && aideCommune));
        for (const k of cles) if (k !== 'aid' && !PAR_CLE_ITEM.has(k)) throw new Error(`${ex.id}, item ${i + 1} : champ inconnu « ${k} » (à ajouter à scripts/contenu/format.mjs)`);
        if (cles.length === 0 || cles[0] === 'aid' || PAR_CLE_ITEM.get(cles[0])[2] === 'liste') cles.unshift('#');
        const numero = `${i + 1}. `;
        const retrait = ' '.repeat(numero.length);
        cles.forEach((k, j) => {
          let champ;
          if (k === '#') champ = ['- item'];
          else if (k === 'aid') champ = ecrireAide(it.aid, '- aide « % » :', '');
          else {
            const [etiquette, , type] = PAR_CLE_ITEM.get(k);
            champ = ecrireChamp(etiquette, type, it[k], '');
          }
          if (j === 0) lignes.push(numero + champ[0].slice(2), ...champ.slice(1).map((l) => retrait + l));
          else lignes.push(...champ.map((l) => retrait + l));
        });
      });
      lignes.push('');
    }
  }
  return lignes.join('\n');
}

// ---------- Lecture ----------

/** Lit le Markdown d'une île : { ile, missions: [{ id, titre }], exercices }. */
export function lireIle(md, fichier = 'md') {
  const lignes = md.split('\n');
  let ile = null;
  const exercices = [];
  const missions = [];
  let mission = null; // { id, titre, champs } : mission en cours
  let ex = null; // exercice en cours
  let item = null; // item en cours
  let liste = null; // { tableau, retrait } : sous-liste en cours (liste d'un champ, lignes d'une aide)
  let aideCommune = null;
  let i = 0;
  const erreur = (m) => new Error(`${fichier}, ligne ${i + 1} : ${m}`);

  // En-tête
  if (lignes[0] !== '---') throw erreur('l’en-tête « --- » manque');
  for (i = 1; i < lignes.length && lignes[i] !== '---'; i++) {
    const m = /^île : (\S+)$/.exec(lignes[i]);
    if (!m) throw erreur(`en-tête inconnu : ${lignes[i]}`);
    ile = m[1];
  }
  if (!ile) throw erreur('« île : … » manque dans l’en-tête');

  const finirExercice = () => {
    if (!ex) return;
    if (aideCommune) for (const it of ex.items) it.aid = structuredClone(aideCommune);
    ex.items.forEach((it, n) => {
      if (it.key === undefined) {
        // la clé par défaut vient en tête, comme dans les JSON d'origine
        const reste = { ...it };
        for (const k of Object.keys(it)) delete it[k];
        Object.assign(it, { key: `${ex.id}-${n}` }, reste);
      }
    });
    exercices.push(ex);
    ex = null;
  };

  const champ = (texte, cible, table, ligne) => {
    const m = /^(.+?) :(?: (.*))?$/.exec(texte);
    if (!m) throw erreur(`« étiquette : valeur » attendu, lu « ${texte} »`);
    const [, etiquette, brut = ''] = m;
    const aide = /^aide « (.+) »$/.exec(etiquette);
    if (aide && table === PAR_ETIQUETTE_ITEM) {
      if (brut !== '') throw erreur('les lignes d’une aide vont en sous-liste');
      cible.aid = { kind: 'rule-card', props: { title: lireTexte(aide[1], ligne), lines: [] } };
      liste = { tableau: cible.aid.props.lines };
      return;
    }
    const def = table.get(etiquette);
    if (!def) throw erreur(`champ inconnu « ${etiquette} »`);
    const [, chemin, type] = def;
    if (obtenir(cible, chemin) !== undefined) {
      throw erreur(ex && mission && obtenir(mission.champs, chemin) !== undefined ? `« ${etiquette} » est déjà donné pour toute la mission` : `« ${etiquette} » écrit deux fois`);
    }
    if (type === 'liste' && brut === '') {
      const tableau = [];
      poser(cible, chemin, tableau);
      liste = { tableau };
      return;
    }
    poser(cible, chemin, lireValeur(type, brut, ligne));
    liste = null;
  };

  for (i++; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.trim() === '') {
      if (liste && liste.retrait === '') liste = null; // une ligne vide finit l'aide commune
      continue;
    }
    if (/^# /.test(l)) continue;
    let m;
    if ((m = /^## (.+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (missions.some((x) => x.id === m[2])) throw erreur(`mission « ${m[2]} » écrite deux fois`);
      mission = { id: m[2], titre: m[1], champs: {} };
      missions.push({ id: mission.id, titre: mission.titre });
      item = null;
      liste = null;
      continue;
    }
    if ((m = /^### Niveau (\d+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (!mission) throw erreur('un niveau doit être sous une mission (« ## Titre · `id` »)');
      ex = { ...structuredClone(mission.champs), id: m[2], biome: ile, type: mission.id, level: Number(m[1]), items: [] };
      item = null;
      liste = null;
      aideCommune = null;
      continue;
    }
    if (l.startsWith('#')) throw erreur(`titre inconnu : ${l}`);
    const cible = ex ?? mission?.champs;
    if (!cible) throw erreur('ligne hors d’une mission');
    if ((m = /^Aide « (.+) », pour tous les items :$/.exec(l))) {
      if (!ex) throw erreur('une aide commune va sous un niveau');
      aideCommune = { kind: 'rule-card', props: { title: lireTexte(m[1], i + 1), lines: [] } };
      liste = { tableau: aideCommune.props.lines, retrait: '' };
      item = null;
      continue;
    }
    if ((m = /^(\d+)\. (.*)$/.exec(l))) {
      if (!ex) throw erreur('un item va sous un niveau');
      if (Number(m[1]) !== ex.items.length + 1) throw erreur(`item ${ex.items.length + 1} attendu, lu ${m[1]}`);
      item = {};
      ex.items.push(item);
      liste = null;
      if (m[2] !== 'item') champ(m[2], item, PAR_ETIQUETTE_ITEM, i + 1);
      continue;
    }
    if (item) {
      const retrait = ' '.repeat(`${ex.items.length}. `.length);
      if ((m = new RegExp(`^${retrait}  - (.*)$`).exec(l)) && liste) {
        liste.tableau.push(lireTexte(m[1], i + 1));
        continue;
      }
      if ((m = new RegExp(`^${retrait}- (.*)$`).exec(l))) {
        champ(m[1], item, PAR_ETIQUETTE_ITEM, i + 1);
        continue;
      }
      throw erreur(`ligne d’item mal alignée : ${l}`);
    }
    if ((m = /^- (.*)$/.exec(l))) {
      if (liste && liste.retrait === '') {
        liste.tableau.push(lireTexte(m[1], i + 1));
        continue;
      }
      champ(m[1], cible, PAR_ETIQUETTE_NIVEAU, i + 1);
      continue;
    }
    if ((m = /^ {2}- (.*)$/.exec(l)) && liste) {
      liste.tableau.push(lireTexte(m[1], i + 1));
      continue;
    }
    throw erreur(`ligne inattendue : ${l}`);
  }
  finirExercice();
  return { ile, missions, exercices: exercices.map(ordonner) };
}

/** L'ordre des champs d'un exercice dans le JSON produit. */
const ORDRE = ['id', 'biome', 'type', 'level', 'title', 'lang', 'target', 'instruction', 'programme', 'items', 'perRun', 'feedback', 'reward', 'adaptive'];

function ordonner(ex) {
  const sortie = {};
  for (const k of ORDRE) if (ex[k] !== undefined) sortie[k] = ex[k];
  for (const k of Object.keys(ex)) if (!(k in sortie)) sortie[k] = ex[k];
  return sortie;
}
