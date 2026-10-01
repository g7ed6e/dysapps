import { firstSentences } from './firstSentences';

it('garde la première phrase si elle est assez longue, le reste à part', () => {
  expect(firstSentences('Une haute tour au bord de la mer, pour les navires. Elle brille la nuit.')).toEqual({
    first: 'Une haute tour au bord de la mer, pour les navires.',
    rest: 'Elle brille la nuit.',
  });
});

it('une phrase trop courte emmène la suivante', () => {
  expect(firstSentences('Salut, bâtisseur ! Dans ma forêt, on écoute les mots. Chaque son trouvé, c’est du bois.')).toEqual({
    first: 'Salut, bâtisseur ! Dans ma forêt, on écoute les mots.',
    rest: 'Chaque son trouvé, c’est du bois.',
  });
  expect(firstSentences('Meuh ! À la ferme, tout doit s’accorder. Trie bien.').first).toBe('Meuh ! À la ferme, tout doit s’accorder.');
});

it('un texte court reste entier, sans suite', () => {
  expect(firstSentences('Hou hou.')).toEqual({ first: 'Hou hou.', rest: '' });
  expect(firstSentences('Bonjour ! Prêt ? Allons-y, il y a du travail aujourd’hui.')).toEqual({
    first: 'Bonjour ! Prêt ? Allons-y, il y a du travail aujourd’hui.',
    rest: '',
  });
});

it('respecte un minimum donné', () => {
  expect(firstSentences('Un. Deux. Trois.', 5)).toEqual({ first: 'Un. Deux.', rest: 'Trois.' });
});
