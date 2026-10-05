import { kindOf } from './props';

it('reconnaît le genre d’un élément de décor, dans le cœur comme dans le paysage', () => {
  expect(kindOf('foret/cœur:arbre@8,2')).toBe('arbre');
  expect(kindOf('mine/sapin@40,12')).toBe('sapin');
});
