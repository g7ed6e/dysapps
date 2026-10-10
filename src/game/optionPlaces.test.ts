// Les lieux d'option (GD-13) : l'île de la LV2 et celle du latin et du grec, ouvertes par un réglage.
import { estLieuDOption, missionsJouables, SANS_LCA, SANS_LV2, sansSonOption, type BiomeDef } from './biomes';

/** Une île du latin et du grec, telle que le Markdown la donnerait (aucune n'est encore au jeu). */
const grotte = {
  subject: 'lca',
  exercises: [
    { id: 'la-founding', title: 'Rome', description: '', programme: [], option: 'la' },
    { id: 'gr-founding', title: 'Cités', description: '', programme: [], option: 'gr' },
    { id: 'gr-alphabet', title: 'L’alphabet grec', description: '', programme: [], option: 'gr', waiting: 'la police grecque' },
  ],
} as unknown as BiomeDef;

it('les missions de l’option choisie seules ; aucune sans option ; jamais une mission en attente', () => {
  expect(missionsJouables(grotte, 'es', 'la').map((m) => m.id)).toEqual(['la-founding']);
  expect(missionsJouables(grotte, 'none', 'gr').map((m) => m.id)).toEqual(['gr-founding']);
  expect(missionsJouables(grotte, 'es', 'none')).toEqual([]);
});

it('la LV2 et l’option sont deux réglages indépendants', () => {
  const relais = { subject: 'lv2', exercises: [{ id: 'es-greetings', lv2: 'es' }] } as unknown as BiomeDef;
  expect(missionsJouables(relais, 'es', 'none').map((m) => m.id)).toEqual(['es-greetings']);
  expect(missionsJouables(relais, 'none', 'la')).toEqual([]);
});

it('un lieu d’option sans son option dit comment l’ouvrir, avec un bouton vers les Réglages', () => {
  expect(estLieuDOption(grotte) && estLieuDOption({ subject: 'lv2' }) && !estLieuDOption({ subject: 'civics' })).toBe(true);
  expect(sansSonOption(grotte, { lv2: 'es', lca: 'none' })).toMatchObject({ lu: SANS_LCA, bouton: 'Choisir l’option' });
  expect(sansSonOption(grotte, { lv2: 'none', lca: 'gr' })).toBeNull();
  expect(sansSonOption({ subject: 'lv2' }, { lv2: 'none', lca: 'la' })).toMatchObject({ lu: SANS_LV2, bouton: 'Choisir une LV2' });
  expect(sansSonOption({ subject: 'civics' }, { lv2: 'none', lca: 'none' })).toBeNull();
  expect(sansSonOption(undefined, { lv2: 'none', lca: 'none' })).toBeNull();
});
