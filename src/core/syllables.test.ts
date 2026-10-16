import { syllabify, syllablesOf } from './syllables';

const CASES: [string, string][] = [
  ['porte', 'por-te'],
  ['table', 'ta-ble'],
  ['montagne', 'mon-ta-gne'],
  ['éléphant', 'é-lé-phant'],
  ['champignon', 'cham-pi-gnon'],
  ['ballon', 'bal-lon'],
  ['poisson', 'pois-son'],
  ['arbre', 'ar-bre'],
  ['monstre', 'mons-tre'],
  ['compter', 'comp-ter'],
  ['escalier', 'es-ca-lier'],
  ['voyage', 'vo-ya-ge'],
  ['pays', 'pays'],
  ['yeux', 'yeux'],
  ['réunion', 'ré-u-nion'],
  ['poète', 'po-è-te'],
  ['maïs', 'ma-ïs'],
  ['année', 'an-née'],
  ['fusées', 'fu-sées'],
  ['oiseau', 'oi-seau'],
  ['exercice', 'e-xer-ci-ce'],
  ['manger', 'man-ger'],
  ['chien', 'chien'],
  ['ciel', 'ciel'],
  ['lion', 'lion'],
  ['enfant', 'en-fant'],
  ['bonbon', 'bon-bon'],
  ['chanter', 'chan-ter'],
  ['renard', 're-nard'],
  ['bâtisseur', 'bâ-tis-seur'],
  ['village', 'vil-la-ge'],
  ['lanterne', 'lan-ter-ne'],
  ['cristal', 'cris-tal'],
  ['fromage', 'fro-ma-ge'],
  ['corbeau', 'cor-beau'],
  ['plumage', 'plu-ma-ge'],
  ['orthographe', 'or-tho-gra-phe'],
  ['Maître', 'Maî-tre'],
  ['œuf', 'œuf'],
  ['a', 'a'],
  // Les rôles des habitants du rivage sud (GD-20, lot L8, relecture dys).
  ['botaniste', 'bo-ta-nis-te'],
  ['archéologue', 'ar-ché-o-lo-gue'],
  // La photographe, le couvreur et l'Observatoire (GD-20, lot L8, directeur artistique) : « ph », « ou », « eu » et
  // « oi » restent entiers, jamais coupés entre deux syllabes (aucun des trois mots n'a de « ch »).
  ['photographe', 'pho-to-gra-phe'],
  ['couvreur', 'cou-vreur'],
  ['Observatoire', 'Ob-ser-va-toi-re'],
];

it.each(CASES)('%s → %s', (word, expected) => {
  expect(syllablesOf(word).join('-')).toBe(expected);
});

it('conserve les espaces, la ponctuation et les apostrophes', () => {
  const pieces = syllabify('L’enfant chante, là-bas !');
  expect(pieces.map((p) => p.text).join('')).toBe('L’enfant chante, là-bas !');
  expect(pieces.filter((p) => p.syllable !== null).map((p) => p.text)).toEqual(['L', 'en', 'fant', 'chan', 'te', 'là', 'bas']);
  expect(pieces.find((p) => p.text === ', ')?.syllable).toBeNull();
});
