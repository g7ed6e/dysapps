// Découpage en syllabes écrites (celles qu'on apprend à l'école : por-te, ta-ble, mon-ta-gne).
// Règles classiques : une consonne entre deux voyelles va avec la voyelle qui suit ;
// deux consonnes se séparent, sauf les groupes insécables (bl, cr, ch, gn…).

const VOWELS = 'aeiouyàâäéèêëîïôöùûüÿœæ';
const ACCENTED = 'éèêëïöü';
/** Groupes de deux consonnes qu'on ne sépare jamais. */
const INSEPARABLE = new Set(['bl', 'cl', 'fl', 'gl', 'pl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr', 'ch', 'ph', 'th', 'sh', 'gn']);

const isVowel = (c: string) => VOWELS.includes(c);

/** Le y est une consonne devant une voyelle en début de mot, ou entre deux voyelles (vo-ya-ge). */
function isVowelAt(word: string, i: number): boolean {
  const c = word[i];
  if (c !== 'y') return isVowel(c);
  const prev = i > 0 ? word[i - 1] : '';
  const next = i + 1 < word.length ? word[i + 1] : '';
  if (i === 0 && isVowel(next)) return false;
  if (isVowel(prev) && isVowel(next)) return false;
  return true;
}

/** Faut-il couper entre deux voyelles qui se suivent (ré-u-nion, po-è-te, ma-ïs) ? */
function splitVowels(word: string, i: number): boolean {
  const a = word[i];
  const b = word[i + 1];
  // « ée », « és », « ées »… en fin de mot restent ensemble (an-née, fu-sée).
  if (ACCENTED.includes(a) && b === 'e' && /^e[sx]?$/.test(word.slice(i + 1))) return false;
  return ACCENTED.includes(a) || ACCENTED.includes(b);
}

/** Découpe un mot (lettres seulement) en syllabes. */
function syllabifyWord(word: string): string[] {
  const lower = word.toLowerCase();
  if (lower.length <= 2) return [word];
  const vowel = [...lower].map((_, i) => isVowelAt(lower, i));
  const cuts: number[] = [];
  let i = 0;
  while (i < lower.length) {
    if (!vowel[i]) {
      i++;
      continue;
    }
    // Fin du noyau vocalique
    let j = i;
    while (j + 1 < lower.length && vowel[j + 1]) {
      if (splitVowels(lower, j)) {
        cuts.push(j + 1);
      }
      j++;
    }
    // Consonnes jusqu'à la voyelle suivante
    let k = j + 1;
    while (k < lower.length && !vowel[k]) k++;
    if (k >= lower.length) break; // pas d'autre voyelle : tout reste attaché
    const cluster = lower.slice(j + 1, k);
    let cut: number;
    if (cluster.length <= 1) cut = j + 1;
    else if (INSEPARABLE.has(cluster.slice(-2))) cut = k - 2;
    else cut = k - 1;
    if (cut > i) cuts.push(cut);
    i = k;
  }
  const out: string[] = [];
  let start = 0;
  for (const c of [...new Set(cuts)].sort((a, b) => a - b)) {
    if (c > start && c < word.length) {
      out.push(word.slice(start, c));
      start = c;
    }
  }
  out.push(word.slice(start));
  return out.filter(Boolean);
}

export interface Piece {
  text: string;
  /** Index de la syllabe dans son mot, ou null pour les espaces et la ponctuation. */
  syllable: number | null;
}

const WORD = /\p{L}+/gu;

/** Découpe un texte : chaque syllabe devient un morceau numéroté, le reste est conservé tel quel. */
export function syllabify(text: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const at = m.index ?? 0;
    if (at > last) pieces.push({ text: text.slice(last, at), syllable: null });
    syllabifyWord(m[0]).forEach((s, i) => pieces.push({ text: s, syllable: i }));
    last = at + m[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last), syllable: null });
  return pieces;
}

/** Syllabes d'un mot, ex. « montagne » → [« mon », « ta », « gne »]. */
export function syllablesOf(word: string): string[] {
  return syllabify(word)
    .filter((p) => p.syllable !== null)
    .map((p) => p.text);
}
