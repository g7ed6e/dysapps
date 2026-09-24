import { loadJSON, saveJSON } from './storage';

describe('storage', () => {
  it('relit ce qui a été sauvegardé', () => {
    saveJSON('test', { a: 1, b: 'x' });
    expect(loadJSON('test', { a: 0, b: '', c: true })).toEqual({ a: 1, b: 'x', c: true });
  });

  it('renvoie la valeur par défaut si les données sont corrompues', () => {
    localStorage.setItem('dysapps:test', '{pas du json');
    expect(loadJSON('test', { a: 0 })).toEqual({ a: 0 });
  });
});

it('ignore une valeur stockée qui n’est pas un objet', () => {
  localStorage.setItem('dysapps:test', '42');
  expect(loadJSON('test', { a: 0 })).toEqual({ a: 0 });
});
