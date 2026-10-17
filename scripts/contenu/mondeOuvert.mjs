// Les phrases des habitants du monde ouvert d'Archipéo (GD-20, point 4, piste B « La remise »), écrites en Markdown dans
// docs/contenu/monde-ouvert.md : une seule forme par moment de la commande, que le jeu remplit avec la commande de
// chaque île (src/game/world/requests.json). Elles redonnent src/game/world/continu/mondeOuvert.json, que seul le monde
// ouvert lit. Les 48 phrases écrites île par île (« ## Les demandes ») restent celles de la grille.
//
//   ## Les habitants
//
//   - demande : Il me faut {objet} pour {nom}. Joue une mission {au lieu}.
//   - demande assemblée : Il me faut {objet} pour {nom}. Assemble les {blocs} {au lieu}.
//   - prête : Livre les {objet} {au lieu}.
//   - consigne : Tu livres {objet} pour {nom}.
//   - posée : {Nom} est {posé}.
//
// Chaque forme a ses jetons, tous exigés, aucun autre permis. Règles de lecture (référent dys, arbitrages du directeur
// artistique) : deux phrases au plus, sept mots au plus par phrase (un jeton compte pour un mot), un point à la fin,
// jamais « ! » ni « … », l'apostrophe typographique, ni « merci », ni « vite », ni « quête », ni le Rafiot.
import { lireTexte } from './texte.mjs';

export const FICHIER_MONDE_OUVERT = 'monde-ouvert.md';

/** Les formes : le mot du Markdown, la clé du JSON et les jetons qu'elle prend. */
export const FORMES = [
  ['demande', 'ask', ['objet', 'nom', 'au lieu']],
  ['demande assemblée', 'askAssembled', ['objet', 'nom', 'blocs', 'au lieu']],
  ['prête', 'ready', ['objet', 'au lieu']],
  ['consigne', 'remise', ['objet', 'nom']],
  ['posée', 'done', ['Nom', 'posé']],
];

const INTERDITS = ['merci', 'vite', 'quête', 'quêtes', 'rafiot'];
export const MOTS_PAR_PHRASE = 7;

/** Les fautes d'une phrase, vide si elle se lit bien. */
export function fautes(texte, jetons) {
  const f = [];
  const lus = [...texte.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
  for (const j of lus) if (!jetons.includes(j)) f.push(`jeton « {${j}} » inconnu ici (${jetons.map((t) => `{${t}}`).join(', ')})`);
  for (const j of jetons) if (!lus.includes(j)) f.push(`le jeton « {${j}} » manque`);
  for (const j of jetons) if (lus.filter((l) => l === j).length > 1) f.push(`le jeton « {${j}} » est écrit deux fois`);
  if (texte.includes("'")) f.push('apostrophe droite : écrire « ’ »');
  if (/!|…|\.\.\./.test(texte)) f.push('ni « ! », ni « … »');
  if (!texte.endsWith('.')) f.push('un point à la fin');
  const sansJetons = texte.replace(/\{[^}]*\}/g, 'X');
  const mots = sansJetons.toLowerCase().split(/[^\p{L}]+/u);
  for (const m of INTERDITS) if (mots.includes(m)) f.push(`le mot « ${m} » n’entre pas dans une phrase d’habitant`);
  const phrases = sansJetons.split(/(?<=\.)\s+/).filter(Boolean);
  if (phrases.length > 2) f.push('deux phrases au plus');
  for (const p of phrases) {
    const n = p.split(/\s+/).filter((m) => /[\p{L}X]/u.test(m)).length;
    if (n > MOTS_PAR_PHRASE) f.push(`« ${p} » : ${n} mots, ${MOTS_PAR_PHRASE} au plus (un jeton compte pour un)`);
  }
  return f;
}

/** docs/contenu/monde-ouvert.md → { ask, askAssembled, ready, remise, done }. */
export function lireMondeOuvert(md, fichier) {
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  const debut = lignes.indexOf('## Les habitants');
  if (debut < 0) throw new Error(`${fichier} : la section « ## Les habitants » manque`);
  const sortie = {};
  for (let i = debut + 1; i < lignes.length && !lignes[i].startsWith('## '); i++) {
    const m = /^- ([^:]+?) : (.*)$/.exec(lignes[i]);
    if (!m) continue;
    const forme = FORMES.find(([mot]) => mot === m[1]);
    if (!forme) throw new Error(`${fichier}, ligne ${i + 1} : forme « ${m[1]} » inconnue (${FORMES.map(([mot]) => mot).join(', ')})`);
    const [, cle, jetons] = forme;
    if (sortie[cle] !== undefined) throw new Error(`${fichier}, ligne ${i + 1} : « ${m[1]} » est écrite deux fois`);
    const texte = lireTexte(m[2], i + 1);
    const f = fautes(texte, jetons);
    if (f.length) throw new Error(`${fichier}, ligne ${i + 1}, « ${m[1]} » : ${f.join(' ; ')}`);
    sortie[cle] = texte;
  }
  for (const [mot, cle] of FORMES) if (sortie[cle] === undefined) throw new Error(`${fichier} : la forme « ${mot} » manque`);
  return Object.fromEntries(FORMES.map(([, cle]) => [cle, sortie[cle]]));
}
