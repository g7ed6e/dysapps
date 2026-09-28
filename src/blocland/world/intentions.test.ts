import type { Intention } from './disposition';
import { origineDe } from './terrain';
import { rappelsDeLaVue } from './view';

// Le contrat des vues (étape J4) : un geste devient une intention, la page décide. Les rappels qu'une vue garde en
// interne sont tirés de ses intentions.
describe('Les intentions d’une vue', () => {
  const recues: Intention[] = [];
  const r = rappelsDeLaVue((i) => recues.push(i), '6e', true);
  beforeEach(() => (recues.length = 0));

  it('chaque geste donne son intention', () => {
    r.onPickIsland!('foret');
    r.onPickBridge!('pont-foret-plaine');
    r.onPickQuest!('foret', 'accords');
    r.onPickPlace!('ecole', 'foret');
    r.onPickCreature!('mine', 'guardian');
    r.onPickCreature!('foret', 'creature');
    r.onPickVehicle!('plaine');
    // Une face touchée, en cases du monde, sur l'île de la Forêt, puis une case du navire amarré à la Plaine.
    const o = origineDe('foret');
    const p = origineDe('plaine');
    r.build!.onPickFace({ x: o.x + 1, y: o.y + 2, z: o.z + 4 }, { x: o.x + 1, y: o.y + 2, z: o.z + 5 });
    r.build!.onPickFace({ x: p.x + 3, y: p.y - 6, z: p.z + 1 }, { x: p.x + 3, y: p.y - 6, z: p.z + 1 }, 'plaine');
    r.onVoyageLegEnd!();
    r.onVoyageSkip!();
    expect(recues).toEqual([
      { genre: 'ile', id: 'foret' },
      { genre: 'ouvrage', id: 'pont-foret-plaine' },
      { genre: 'borne', ile: 'foret', mission: 'accords' },
      { genre: 'lieu', id: 'ecole', ile: 'foret' },
      { genre: 'creature', id: 'mine', gardien: true },
      { genre: 'creature', id: 'foret', gardien: false },
      { genre: 'navire', port: 'plaine' },
      // En cases du plan de l'île : son repère, un cran plus bas.
      { genre: 'face', ile: 'foret', case: { x: 1, y: 2, z: 3 }, voisine: { x: 1, y: 2, z: 4 } },
      { genre: 'face', ile: 'plaine', case: { x: 3, y: -6, z: 0 }, voisine: { x: 3, y: -6, z: 0 } },
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
