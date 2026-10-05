import type { Intention } from './layout';
import { origineDe } from './terrain';
import { rappelsDeLaVue } from './view';

// Le contrat des vues (étape J4) : un geste devient une intention, la page décide. Les rappels qu'une vue garde en
// interne sont tirés de ses intentions.
describe('Les intentions d’une vue', () => {
  const recues: Intention[] = [];
  const r = rappelsDeLaVue((i) => recues.push(i), '6e', true);
  beforeEach(() => (recues.length = 0));

  it('chaque geste donne son intention', () => {
    r.onPickIsland!('french-6e-phonology');
    r.onPickBridge!('pont-foret-plaine');
    r.onPickQuest!('french-6e-phonology', 'accords');
    r.onPickPlace!('school', 'french-6e-phonology');
    r.onPickCreature!('french-6e-letter-confusion', 'guardian');
    r.onPickCreature!('french-6e-phonology', 'creature');
    r.onPickVehicle!('maths-6e-calculation');
    // Une face touchée, en cases du monde, sur l'île de la Forêt, puis une case du navire amarré à la Plaine.
    const o = origineDe('french-6e-phonology');
    const p = origineDe('maths-6e-calculation');
    r.build!.onPickFace({ x: o.x + 1, y: o.y + 2, z: o.z + 4 }, { x: o.x + 1, y: o.y + 2, z: o.z + 5 });
    r.build!.onPickFace({ x: p.x + 3, y: p.y - 6, z: p.z + 1 }, { x: p.x + 3, y: p.y - 6, z: p.z + 1 }, { ile: 'maths-6e-calculation' });
    r.onVoyageLegEnd!();
    r.onVoyageSkip!();
    expect(recues).toEqual([
      { genre: 'ile', id: 'french-6e-phonology' },
      { genre: 'ouvrage', id: 'pont-foret-plaine' },
      { genre: 'borne', ile: 'french-6e-phonology', mission: 'accords' },
      { genre: 'lieu', id: 'school', ile: 'french-6e-phonology' },
      { genre: 'creature', id: 'french-6e-letter-confusion', gardien: true },
      { genre: 'creature', id: 'french-6e-phonology', gardien: false },
      { genre: 'navire', port: 'maths-6e-calculation' },
      // En cases du plan de l'île : son repère, un cran plus bas.
      { genre: 'face', ile: 'french-6e-phonology', case: { x: 1, y: 2, z: 3 }, voisine: { x: 1, y: 2, z: 4 } },
      { genre: 'face', ile: 'maths-6e-calculation', case: { x: 3, y: -6, z: 0 }, voisine: { x: 3, y: -6, z: 0 } },
      { genre: 'fin-du-voyage' },
      { genre: 'voyage-saute' },
    ]);
  });

  it('hors chantier, toucher une face n’existe pas : on touche l’île', () => {
    expect(rappelsDeLaVue(() => {}, '6e').build).toBeUndefined();
  });

  it('sans intentions, la vue se regarde sans se toucher', () => {
    expect(rappelsDeLaVue(undefined, '6e', true)).toEqual({});
  });
});
