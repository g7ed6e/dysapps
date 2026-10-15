import { retenirMotsEtrangers, segmentsForSpeech, splitForeignWords, type ForeignWord } from './foreignWords';
import { speak } from './speech';

const MOTS: ForeignWord[] = [
  { word: 'rosam', lang: 'la', spoken: 'rossamm' },
  { word: 'rosa', lang: 'la', spoken: 'rossa' },
  { word: 'domine', lang: 'la', spoken: 'dominé' },
  { word: '-am', lang: 'la', spoken: 'amm' },
  { word: 'Senatus Populusque Romanus', lang: 'la', spoken: 'Sénatouss Popoulouskwé Romanouss' },
  { word: 'pes, pedis', lang: 'la', spoken: 'pèss, pédiss' },
  { word: 'philos', lang: 'grc-Latn', spoken: 'filoss' },
  { word: 'notte', lang: 'it' },
  { word: 'fotografía', lang: 'es' },
];

describe('les mots marqués d’une île (latin, grec transcrit, langues vivantes citées)', () => {
  it('coupe le texte en morceaux : le français, et chaque mot marqué, sans tenir compte des majuscules', () => {
    expect(splitForeignWords('Puella rosam amat. Domine !', MOTS)).toEqual([
      { text: 'Puella ' },
      { text: 'rosam', word: MOTS[0] },
      { text: ' amat. ' },
      { text: 'Domine', word: MOTS[2] },
      { text: ' !' },
    ]);
  });

  it('reconnaît un mot entier seulement, le plus long d’abord, et la terminaison montrée par un trait', () => {
    expect(splitForeignWords('rosace', MOTS)).toEqual([{ text: 'rosace' }]);
    expect(splitForeignWords('ros-am', MOTS)).toEqual([{ text: 'ros-am', word: MOTS[0] }]);
    expect(splitForeignWords('Accusatif : ros-am · terminaison -am', MOTS).filter((r) => r.word).map((r) => r.word?.word)).toEqual(['rosam', '-am']);
    expect(splitForeignWords('SPQR : Senatus Populusque Romanus.', MOTS)[1].word?.word).toBe('Senatus Populusque Romanus');
    expect(splitForeignWords('pes, pedis : le pied', MOTS)[0].word?.word).toBe('pes, pedis');
  });

  it('sans mots marqués, le texte reste d’un seul morceau', () => {
    expect(splitForeignWords('Puella rosam amat.', undefined)).toEqual([{ text: 'Puella rosam amat.' }]);
    expect(splitForeignWords('', MOTS)).toEqual([{ text: '' }]);
  });

  it('la voix française dit le latin et le grec comme l’écrit leur « lu » ; une langue vivante citée, avec sa voix', () => {
    expect(segmentsForSpeech('rosam finit en -am : philos, l’ami.', MOTS)).toEqual([{ text: 'rossamm finit en amm : filoss, l’ami.', lang: 'fr' }]);
    expect(segmentsForSpeech('Italien : notte. Espagnol : fotografía.', MOTS)).toEqual([
      { text: 'Italien : ', lang: 'fr' },
      { text: 'notte', lang: 'it' },
      { text: '. Espagnol : ', lang: 'fr' },
      { text: 'fotografía', lang: 'es' },
      { text: '.', lang: 'fr' },
    ]);
  });

  it('la voix lit les mots de l’île retenue, en morceaux, et ne prévient qu’à la fin du dernier', () => {
    const dits: { text: string; lang: string; onend: unknown }[] = [];
    class Utterance {
      text: string;
      lang = '';
      rate = 1;
      voice: unknown = null;
      onend: unknown = null;
      onerror: unknown = null;
      constructor(t: string) {
        this.text = t;
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: Utterance) => dits.push(u) });
    try {
      retenirMotsEtrangers(MOTS);
      const fin = () => {};
      speak('Italien : notte.', 1, fin);
      expect(dits.map((u) => [u.text, u.lang])).toEqual([
        ['Italien : ', 'fr-FR'],
        ['notte', 'it-IT'],
        ['.', 'fr-FR'],
      ]);
      expect(dits.map((u) => u.onend)).toEqual([null, null, fin]);
      // Hors de l'île, le texte est lu tel quel.
      retenirMotsEtrangers(undefined);
      speak('rosam', 1);
      expect(dits.at(-1)?.text).toBe('rosam');
    } finally {
      retenirMotsEtrangers(undefined);
      vi.unstubAllGlobals();
    }
  });
});
