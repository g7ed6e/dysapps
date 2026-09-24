import { fractionWords, speakFractions } from './fractions';

it('lit les fractions en toutes lettres', () => {
  expect(fractionWords(1, 2)).toBe('un demi');
  expect(fractionWords(3, 4)).toBe('3 quarts');
  expect(fractionWords(2, 3)).toBe('2 tiers');
  expect(fractionWords(2, 5)).toBe('2 cinquièmes');
  expect(fractionWords(1, 9)).toBe('un neuvième');
  expect(fractionWords(7, 10)).toBe('7 dixièmes');
  expect(fractionWords(37, 100)).toBe('37 centièmes');
});

it('remplace les fractions dans une phrase', () => {
  expect(speakFractions('3/4 de 20')).toBe('3 quarts de 20');
});
