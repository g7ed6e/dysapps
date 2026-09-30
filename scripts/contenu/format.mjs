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
//   Pour tous les items :                    ← champs communs à tous les items du niveau (ou de la mission)
//   - aide « Se présenter » :
//     - Hello / Hi = bonjour.
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
  if (v === '' || v !== v.trim()) throw new Error(`ligne ${ligne} : valeur vide ou avec des espaces au bord : l’écrire entre guillemets (« "" »)`);
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
    if (!/^-?\d+(\.\d+)?$/.test(v)) throw new Error(`ligne ${ligne} : nombre attendu, lu « ${v} »`);
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

/** Les champs d'un item, dans l'ordre d'écriture : la clé (si elle n'est pas celle par défaut), les champs du tableau ITEM, l'aide. */
function champsItem(it, defaut) {
  for (const k of Object.keys(it)) if (k !== 'aid' && !PAR_CLE_ITEM.has(k)) throw new Error(`${defaut} : champ inconnu « ${k} » (à ajouter à scripts/contenu/format.mjs)`);
  const cles = ITEM.map((c) => c[1]).filter((k) => it[k] !== undefined && !(k === 'key' && it.key === defaut));
  if (it.aid !== undefined) cles.push('aid');
  return cles;
}

/** Le premier champ d'un item hors clé : celui qui le nomme, jamais mis en commun. */
export function principal(it) {
  return ITEM.map((c) => c[1]).find((k) => k !== 'key' && it[k] !== undefined);
}

/** Les champs identiques dans tous les items donnés (au moins deux), hors clé et hors champ principal d'un item. */
function champsCommuns(items, exclus) {
  if (items.length < 2) return [];
  const principaux = new Set(items.map(principal));
  const cles = [...ITEM.map((c) => c[1]), 'aid'].filter((k) => k !== 'key' && !principaux.has(k) && !exclus.includes(k));
  return cles.filter((k) => {
    const v = JSON.stringify(items[0][k]);
    return v !== undefined && items.every((it) => JSON.stringify(it[k]) === v);
  });
}

function ecrireChampItem(it, k) {
  if (k === 'aid') return ecrireAide(it.aid, '- aide « % » :', '');
  const [etiquette, , type] = PAR_CLE_ITEM.get(k);
  return ecrireChamp(etiquette, type, it[k], '');
}

function ecrirePourTous(item, cles) {
  if (cles.length === 0) return [];
  return ['Pour tous les items :', ...cles.flatMap((k) => ecrireChampItem(item, k)), ''];
}

/**
 * Écrit le Markdown d'une île. `ile` = { id, nom, missions: [{ id, titre }] } (les missions sans exercice sont
 * omises ; un type d'exercice absent de la liste devient une mission à son nom). Ce qui vaut pour tous les niveaux
 * d'une mission, ou pour tous les items d'une mission ou d'un niveau, s'écrit une fois.
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
    const tousItems = niveaux.flatMap((ex) => ex.items);
    const itemsMission = champsCommuns(tousItems, []);
    lignes.push(`## ${mission.titre} · \`${mission.id}\``, '');
    for (const [etiquette, chemin, type] of communs) lignes.push(...ecrireChamp(etiquette, type, obtenir(niveaux[0], chemin), ''));
    if (communs.length) lignes.push('');
    lignes.push(...ecrirePourTous(tousItems[0], itemsMission));
    for (const ex of niveaux) {
      lignes.push(`### Niveau ${ex.level} · \`${ex.id}\``, '');
      const propres = NIVEAU.filter((def) => obtenir(ex, def[1]) !== undefined && !communs.includes(def));
      for (const [etiquette, chemin, type] of propres) lignes.push(...ecrireChamp(etiquette, type, obtenir(ex, chemin), ''));
      if (propres.length) lignes.push('');
      const itemsNiveau = champsCommuns(ex.items, itemsMission);
      lignes.push(...ecrirePourTous(ex.items[0], itemsNiveau));
      const partages = new Set([...itemsMission, ...itemsNiveau]);
      ex.items.forEach((it, i) => {
        const cles = champsItem(it, `${ex.id}-${i}`).filter((k) => !partages.has(k));
        if (cles.length === 0 || cles[0] === 'aid' || PAR_CLE_ITEM.get(cles[0])[2] === 'liste') cles.unshift('#');
        const numero = `${i + 1}. `;
        const retrait = ' '.repeat(numero.length);
        cles.forEach((k, j) => {
          const champ = k === '#' ? ['- item'] : ecrireChampItem(it, k);
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
  const lignes = md.replace(/^\uFEFF/, '').split(/\r?\n/);
  let ile = null;
  const exercices = [];
  const missions = [];
  let mission = null; // { id, titre, champs, items } : mission en cours (items : champs pour tous ses items)
  let ex = null; // exercice en cours
  let pourTousNiveau = null; // champs pour tous les items du niveau en cours
  let item = null; // item en cours (ses propres champs)
  let pourTous = null; // bloc « Pour tous les items » en cours de lecture
  let liste = null; // tableau : sous-liste en cours (liste d'un champ, lignes d'une aide)
  let i = 0;
  const erreur = (m) => new Error(`${fichier}, ligne ${i + 1} : ${m}`);

  // En-tête
  if (lignes[0] !== '---') throw erreur('l’en-tête « --- » manque');
  for (i = 1; i < lignes.length && lignes[i] !== '---'; i++) {
    const m = /^île : (\S+)$/.exec(lignes[i]);
    if (!m) throw erreur(`en-tête inconnu : ${lignes[i]}`);
    if (ile) throw erreur('« île » écrite deux fois dans l’en-tête');
    ile = m[1];
  }
  if (!ile) throw erreur('« île : … » manque dans l’en-tête');

  const finirExercice = () => {
    if (!ex) return;
    ex.items = ex.items.map((propre, n) =>
      ordonnerItem({ key: `${ex.id}-${n}`, ...structuredClone(mission.items), ...structuredClone(pourTousNiveau), ...propre }),
    );
    // Une clé par défaut (le rang) peut retomber sur une clé écrite à la main : deux items partageraient alors
    // la même répétition espacée.
    const vus = new Map();
    ex.items.forEach((it, n) => {
      if (vus.has(it.key)) {
        throw new Error(
          `${fichier}, ${ex.id} : les items ${vus.get(it.key) + 1} et ${n + 1} ont la même clé « ${it.key} » ; donner à l’item nouveau une clé à lui (« - clé : … »)`,
        );
      }
      vus.set(it.key, n);
    });
    exercices.push(ex);
    ex = null;
  };

  const champ = (texte, cible, table, ligne) => {
    const aide = table === PAR_ETIQUETTE_ITEM && /^aide « (.+) » :$/.exec(texte);
    if (aide) {
      if (cible.aid !== undefined) throw erreur('aide écrite deux fois');
      cible.aid = { kind: 'rule-card', props: { title: lireTexte(aide[1], ligne), lines: [] } };
      liste = cible.aid.props.lines;
      return;
    }
    const m = /^(.+?) :(?: (.*))?$/.exec(texte);
    if (!m) throw erreur(`« étiquette : valeur » attendu, lu « ${texte} »`);
    const [, etiquette, brut = ''] = m;
    const def = table.get(etiquette);
    if (!def) throw erreur(`champ inconnu « ${etiquette} »`);
    const [, chemin, type] = def;
    if (obtenir(cible, chemin) !== undefined) {
      throw erreur(ex && mission && obtenir(mission.champs, chemin) !== undefined ? `« ${etiquette} » est déjà donné pour toute la mission` : `« ${etiquette} » écrit deux fois`);
    }
    if (type === 'liste' && brut === '') {
      liste = [];
      poser(cible, chemin, liste);
      return;
    }
    poser(cible, chemin, lireValeur(type, brut, ligne));
    liste = null;
  };

  for (i++; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.trim() === '') {
      pourTous = liste = null; // une ligne vide finit le bloc « Pour tous les items » et toute sous-liste
      continue;
    }
    if (/^# /.test(l)) {
      if (mission) throw erreur('le titre de l’île va avant la première mission');
      continue;
    }
    let m;
    if ((m = /^## (.+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (!/^[a-z0-9-]+$/.test(m[2])) throw erreur(`identifiant de mission mal écrit : ${m[2]}`);
      if (missions.some((x) => x.id === m[2])) throw erreur(`mission « ${m[2]} » écrite deux fois`);
      mission = { id: m[2], titre: m[1], champs: {}, items: {} };
      missions.push({ id: mission.id, titre: mission.titre });
      item = pourTous = liste = null;
      continue;
    }
    if ((m = /^### Niveau (\d+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (!mission) throw erreur('un niveau doit être sous une mission (« ## Titre · `id` »)');
      if (!/^[a-z0-9-]+$/.test(m[2]) || !m[2].startsWith(`${ile}-`)) throw erreur(`identifiant d’exercice mal écrit : ${m[2]} (lettres minuscules, chiffres et tirets, commençant par « ${ile}- »)`);
      ex = { ...structuredClone(mission.champs), id: m[2], biome: ile, type: mission.id, level: Number(m[1]), items: [] };
      pourTousNiveau = {};
      item = pourTous = liste = null;
      continue;
    }
    if (l.startsWith('#')) throw erreur(`titre inconnu : ${l}`);
    if (!mission) throw erreur('ligne hors d’une mission');
    if (l === 'Pour tous les items :') {
      if (item) throw erreur('« Pour tous les items » va avant le premier item');
      pourTous = ex ? pourTousNiveau : mission.items;
      liste = null;
      continue;
    }
    if ((m = /^(\d+)\. (.*)$/.exec(l))) {
      if (!ex) throw erreur('un item va sous un niveau');
      if (Number(m[1]) !== ex.items.length + 1) throw erreur(`item ${ex.items.length + 1} attendu, lu ${m[1]}`);
      item = {};
      ex.items.push(item);
      pourTous = liste = null;
      if (m[2] !== 'item') champ(m[2], item, PAR_ETIQUETTE_ITEM, i + 1);
      continue;
    }
    if (item) {
      const retrait = ' '.repeat(`${ex.items.length}. `.length);
      if ((m = new RegExp(`^${retrait}  - (.*)$`).exec(l)) && liste) {
        liste.push(lireTexte(m[1], i + 1));
        continue;
      }
      if ((m = new RegExp(`^${retrait}- (.*)$`).exec(l))) {
        champ(m[1], item, PAR_ETIQUETTE_ITEM, i + 1);
        continue;
      }
      throw erreur(`ligne d’item mal alignée : ${l}`);
    }
    if ((m = /^ {2}- (.*)$/.exec(l)) && liste) {
      liste.push(lireTexte(m[1], i + 1));
      continue;
    }
    if ((m = /^- (.*)$/.exec(l))) {
      if (pourTous) champ(m[1], pourTous, PAR_ETIQUETTE_ITEM, i + 1);
      else champ(m[1], ex ?? mission.champs, PAR_ETIQUETTE_NIVEAU, i + 1);
      continue;
    }
    throw erreur(`ligne inattendue : ${l}`);
  }
  finirExercice();
  return { ile, missions, exercices: exercices.map(ordonner) };
}

/** L'ordre des champs d'un item dans le JSON produit : celui du tableau ITEM, puis l'aide. */
function ordonnerItem(it) {
  const sortie = {};
  for (const [, k] of ITEM) if (it[k] !== undefined) sortie[k] = it[k];
  if (it.aid !== undefined) sortie.aid = it.aid;
  return sortie;
}

/** L'ordre des champs d'un exercice dans le JSON produit. */
const ORDRE = ['id', 'biome', 'type', 'level', 'title', 'lang', 'target', 'instruction', 'programme', 'items', 'perRun', 'feedback', 'reward', 'adaptive'];

function ordonner(ex) {
  const sortie = {};
  for (const k of ORDRE) if (ex[k] !== undefined) sortie[k] = ex[k];
  for (const k of Object.keys(ex)) if (!(k in sortie)) sortie[k] = ex[k];
  return sortie;
}
