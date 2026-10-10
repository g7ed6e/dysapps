// La voix d'une île, écrite à la fin de son Markdown (docs/contenu/<île>.md), avant « ## Les plans », sous « ## La voix » :
// un tableau, une rangée par mot (ou expression) qui n'est pas du français. Sur l'île du latin et du grec, chaque mot du
// tableau s'affiche marqué dans sa langue, sans syllabes colorées, et la voix le lit comme le dit la colonne « lu »
// (le latin, le grec transcrit), ou avec la voix de sa langue (l'italien, l'espagnol, l'anglais cités), partout où il
// apparaît : question, rappel, choix, indice, explication (principes dys, « Le latin et le grec »). Le jeu les lit dans
// `foreignWords` de l'île (src/game/islands.ts ; src/core/foreignWords.ts).
import { ecrireTexte, lireTexte } from './texte.mjs';

export const TITRE_VOIX = '## La voix';
const COLONNES = ['mot', 'langue', 'lu'];

/** Les langues d'un mot du tableau : le latin et le grec transcrit sont lus par la voix française, avec leur « lu ». */
export const LANGUES_LUES = ['la', 'grc-Latn'];
/** Les langues vivantes citées : lues par la voix de leur langue, sans « lu ». */
export const LANGUES_VIVANTES = ['it', 'es', 'en'];

const rangee = (cases) => `| ${cases.join(' | ')} |`;

function enCase(s, ou) {
  if (typeof s !== 'string' || s.includes('|') || /[\n\r]/.test(s)) throw new Error(`${ou} : « ${s} » ne tient pas dans une case (ni « | », ni saut de ligne)`);
  return ecrireTexte(s);
}

/** Les lignes de la section « ## La voix » (vide sans lexique). */
export function ecrireVoix(lexique = []) {
  if (lexique.length === 0) return [];
  const rangees = lexique.map((m) => [enCase(m.word, `mot ${m.word}`), m.lang, m.spoken === undefined ? '' : enCase(m.spoken, `mot ${m.word}`)]);
  return [TITRE_VOIX, '', rangee(COLONNES), rangee(COLONNES.map(() => '---')), ...rangees.map(rangee), ''];
}

/**
 * Lit la section « ## La voix » : `lignes` commence à son titre, `debut` est le rang de ce titre dans le fichier (pour
 * les numéros de ligne). Rend le lexique de l'île : [{ word, lang, spoken? }], dans l'ordre du tableau.
 */
export function lireVoix(lignes, debut, fichier) {
  let i = 1;
  const erreur = (m, n = debut + i) => new Error(`${fichier}, ligne ${n + 1} : ${m}`);
  while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
  const cases = (l) => {
    if (!l?.startsWith('|') || !l.endsWith('|') || l.length < 2) throw erreur(`ligne de tableau attendue, lu « ${l} »`);
    return l.slice(1, -1).split('|').map((c) => c.trim());
  };
  if (cases(lignes[i]).join('|') !== COLONNES.join('|')) throw erreur(`colonnes attendues : ${COLONNES.join(', ')}`);
  i++;
  const sep = cases(lignes[i]);
  if (sep.length !== COLONNES.length || !sep.every((c) => /^:?-+:?$/.test(c))) throw erreur('ligne « |---|---| » attendue');
  i++;
  const lexique = [];
  for (; i < lignes.length && lignes[i].startsWith('|'); i++) {
    const n = debut + i + 1;
    const r = cases(lignes[i]);
    if (r.length !== COLONNES.length) throw erreur(`${COLONNES.length} cases attendues, lu ${r.length}`);
    const texte = (v) => {
      try {
        return lireTexte(v, n);
      } catch (e) {
        throw new Error(`${fichier}, ${e.message}`);
      }
    };
    const [mot, langue, lu] = [texte(r[0]), r[1], r[2] === '' ? undefined : texte(r[2])];
    if (!mot.trim()) throw erreur('mot vide');
    if (lexique.some((m) => m.word.toLowerCase() === mot.toLowerCase())) throw erreur(`le mot « ${mot} » est écrit deux fois`);
    if (LANGUES_LUES.includes(langue)) {
      if (lu === undefined) throw erreur(`« ${mot} » (${langue}) : écrire dans « lu » comment la voix française le dit`);
    } else if (LANGUES_VIVANTES.includes(langue)) {
      if (lu !== undefined) throw erreur(`« ${mot} » (${langue}) : un mot de langue vivante est lu par la voix de sa langue, sans « lu »`);
    } else {
      throw erreur(`langue « ${langue} » inconnue (${[...LANGUES_LUES, ...LANGUES_VIVANTES].join(', ')})`);
    }
    lexique.push({ word: mot, lang: langue, ...(lu === undefined ? {} : { spoken: lu }) });
  }
  if (lexique.length === 0) throw erreur('le tableau de la voix n’a aucun mot');
  while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
  if (i < lignes.length) throw erreur(`ligne inattendue après le tableau de la voix : ${lignes[i]}`);
  return lexique;
}
