// Les phrases des habitants du monde ouvert d'Archipéo (GD-20, point 4, piste B « La remise »), écrites en Markdown dans
// docs/contenu/monde-ouvert.md : une seule forme par moment de la commande, que le jeu remplit avec la commande de
// chaque île (src/game/world/requests.json). Elles redonnent src/game/world/continu/mondeOuvert.json, que seul le monde
// ouvert lit. Les 48 phrases écrites île par île (« ## Les demandes ») restent celles de la grille.
//
//   ## Les habitants
//
//   - demande : Il me faut {objet}. C’est pour {nom}. Joue une mission {au lieu}.
//   - demande assemblée : Il me faut {objet}. C’est pour {nom}. Assemble les {blocs} {au lieu}.
//   - prête : Livre {objet} {au lieu}.
//   - consigne : Tu livres {objet} pour {nom}.
//   - posée : {Nom} est en place.
//
//   ## L’entraide
//
//   - mission : Joue une mission {au lieu}.
//   - donner : Donne {objet} {au lieu}.
//   - apporter : Apporte {nom} {au lieu}.
//   - consigne donner : Tu donnes {objet} pour {nom}.
//   - consigne apporter : Tu apportes {nom}.
//
//   ## La révision
//
//   - entrée : Tu revois {questions}.
//   - fin : Tu as revu {questions}.
//   - rappel : On revoit quelques questions ensemble.
//
//   ## Les veillées
//   ## L’équipage (la ligne fixe de Zia et de Malo près de l'habitant du premier lieu rallumé qu'ils ont guidé, GD-27, lot 5)
//
//   - feu éteint : {Feu} est éteint.
//   - feu allumé : {Feu} est allumé.
//   - embarquement : {Équipier} monte à bord.
//
// Les étapes de l'entraide (lot L2) : une forme par geste, que le jeu remplit avec l'étape de la quête d'entraide du 6e
// (src/game/world/stories.json) ; la fin d'« Apporter » reprend « posée », ce qui manque pour « Donner » reprend
// « demande ». La révision jouée dans la scène du lieu (lot L3) : la phrase d'entrée et celle du bilan, sans date ni échec ; le rappel
// de l'habitant, une forme sans jeton (ni nom de mission ni nombre), qui remplace celui de la grille dans le monde ouvert.
// Les veillées (GD-23, GD-27, lots 3 et 3 bis) : la seule ligne de chacune, que le jeu remplit aux quatre niveaux avec le nom
// du feu du niveau (« Le Phare », « Le Sémaphore », « La Forge », accordé par le code au nom du lieu, « Le Fanal ») ou de
// l'équipier qui monte à bord (« L’équipière radio », « Le naturaliste ») ; lue par src/game/world/continu/levelVigils.ts.
//
// Chaque forme a ses jetons, tous exigés, aucun autre permis, jamais une accolade seule. Règles de lecture (référent dys,
// arbitrages du directeur artistique) : trois phrases au plus, un point à la fin, jamais « ! » ni « … », l'apostrophe
// typographique, ni « merci », ni « vite », ni « quête », ni le Rafiot. Le plafond de mots se compte sur le texte rempli,
// que ce script ne connaît pas (les noms des blocs et des lieux sont dans le code) : `remiseOf.test.ts` remplit chaque
// forme avec les seize commandes du 6e et le vérifie.
import { lireTexte } from './texte.mjs';

export const FICHIER_MONDE_OUVERT = 'monde-ouvert.md';

/** Les sections, dans l'ordre du fichier : leur titre, et leurs formes (le mot du Markdown, la clé du JSON, ses jetons). */
export const SECTIONS = [
  [
    '## Les habitants',
    [
      ['demande', 'ask', ['objet', 'nom', 'au lieu']],
      ['demande assemblée', 'askAssembled', ['objet', 'nom', 'blocs', 'au lieu']],
      ['prête', 'ready', ['objet', 'au lieu']],
      ['consigne', 'remise', ['objet', 'nom']],
      ['posée', 'done', ['Nom']],
    ],
  ],
  [
    '## L’entraide',
    [
      ['mission', 'stepMission', ['au lieu']],
      ['donner', 'stepGive', ['objet', 'au lieu']],
      ['apporter', 'stepBring', ['nom', 'au lieu']],
      ['consigne donner', 'giveRemise', ['objet', 'nom']],
      ['consigne apporter', 'bringRemise', ['nom']],
    ],
  ],
  [
    '## La révision',
    [
      ['entrée', 'revisionEntry', ['questions']],
      ['fin', 'revisionDone', ['questions']],
      ['rappel', 'revisionReminder', []],
    ],
  ],
  [
    '## Les veillées',
    [
      ['feu éteint', 'fireOut', ['Feu']],
      ['feu allumé', 'fireLit', ['Feu']],
      ['embarquement', 'boarding', ['Équipier']],
    ],
  ],
  [
    '## L’équipage',
    [
      ['Zia', 'equipageZia', []],
      ['Malo', 'equipageMalo', []],
    ],
  ],
];

/** Toutes les formes, section après section : le mot du Markdown, la clé du JSON et les jetons qu'elle prend. */
export const FORMES = SECTIONS.flatMap(([, formes]) => formes);

const INTERDITS = ['merci', 'vite', 'quête', 'quêtes', 'rafiot'];
/** Les phrases d'une forme, au plus : une idée par phrase (le besoin, ce pour quoi, le geste). */
export const PHRASES_PAR_FORME = 3;

/** Les fautes d'une phrase, vide si elle se lit bien. */
export function fautes(texte, jetons) {
  const f = [];
  const lus = [...texte.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
  for (const j of lus) if (!jetons.includes(j)) f.push(`jeton « {${j}} » inconnu ici (${jetons.map((t) => `{${t}}`).join(', ')})`);
  for (const j of jetons) if (!lus.includes(j)) f.push(`le jeton « {${j}} » manque`);
  for (const j of jetons) if (lus.filter((l) => l === j).length > 1) f.push(`le jeton « {${j}} » est écrit deux fois`);
  if (/[{}]/.test(texte.replace(/\{[^{}]*\}/g, ''))) f.push('une accolade seule : un jeton s’écrit « {jeton} »');
  if (texte.includes("'")) f.push('apostrophe droite : écrire « ’ »');
  if (/!|…|\.\.\./.test(texte)) f.push('ni « ! », ni « … »');
  if (!texte.endsWith('.')) f.push('un point à la fin');
  const sansJetons = texte.replace(/\{[^}]*\}/g, 'X');
  const mots = sansJetons.toLowerCase().split(/[^\p{L}]+/u);
  for (const m of INTERDITS) if (mots.includes(m)) f.push(`le mot « ${m} » n’entre pas dans une phrase d’habitant`);
  const phrases = sansJetons.split(/(?<=\.)\s+/).filter(Boolean);
  if (phrases.length > PHRASES_PAR_FORME) f.push(`${PHRASES_PAR_FORME} phrases au plus`);
  return f;
}

/** docs/contenu/monde-ouvert.md → { ask, askAssembled, ready, remise, done, stepMission, …, revisionReminder, fireOut, fireLit, boarding }. */
export function lireMondeOuvert(md, fichier) {
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  const sortie = {};
  for (const [titre, formes] of SECTIONS) {
    const debut = lignes.indexOf(titre);
    if (debut < 0) throw new Error(`${fichier} : la section « ${titre} » manque`);
    for (let i = debut + 1; i < lignes.length && !lignes[i].startsWith('## '); i++) {
      const m = /^- ([^:]+?) : (.*)$/.exec(lignes[i]);
      if (!m) continue;
      const forme = formes.find(([mot]) => mot === m[1]);
      if (!forme) throw new Error(`${fichier}, ligne ${i + 1} : forme « ${m[1]} » inconnue dans « ${titre.slice(3)} » (${formes.map(([mot]) => mot).join(', ')})`);
      const [, cle, jetons] = forme;
      if (sortie[cle] !== undefined) throw new Error(`${fichier}, ligne ${i + 1} : « ${m[1]} » est écrite deux fois`);
      const texte = lireTexte(m[2], i + 1);
      const f = fautes(texte, jetons);
      if (f.length) throw new Error(`${fichier}, ligne ${i + 1}, « ${m[1]} » : ${f.join(' ; ')}`);
      sortie[cle] = texte;
    }
  }
  for (const [mot, cle] of FORMES) if (sortie[cle] === undefined) throw new Error(`${fichier} : la forme « ${mot} » manque`);
  return Object.fromEntries(FORMES.map(([, cle]) => [cle, sortie[cle]]));
}
