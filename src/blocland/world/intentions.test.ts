import type { Intention } from './disposition';
import { rappelsDeLaVue } from './view';

// Le contrat des vues (étape J4) : un geste devient une intention, la page décide. Les rappels qu'une vue garde en
// interne sont tirés de ses intentions.
describe('Les intentions d’une vue', () => {
  const recues: Intention[] = [];
  const r = rappelsDeLaVue((i) => recues.push(i), true);
  beforeEach(() => (recues.length = 0));

  it('chaque geste donne son intention', () => {
    r.onPickIsland!('foret');
    r.onPickBridge!('pont-foret-plaine');
    r.onPickQuest!('foret', 'accords');
    r.onPickPlace!('ecole', 'foret');
    r.onPickCreature!('mine', 'guardian');
    r.onPickCreature!('foret', 'creature');
    r.onPickVehicle!('plaine');
    r.build!.onPickFace({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 4 });
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
      { genre: 'face', case: { x: 1, y: 2, z: 3 }, voisine: { x: 1, y: 2, z: 4 } },
      { genre: 'fin-du-voyage' },
      { genre: 'voyage-saute' },
    ]);
  });

  it('hors chantier, toucher une face n’existe pas : on touche l’île', () => {
    expect(rappelsDeLaVue(() => {}).build).toBeUndefined();
  });

  it('sans intentions, la vue se regarde sans se toucher', () => {
    expect(rappelsDeLaVue(undefined, true)).toEqual({});
  });
});
