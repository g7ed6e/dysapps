import { BIOMES } from '../biomes';
import { EMPTY_STATE, levelFor, type BloclandState } from '../engine';
import { pickExercise, questProgress } from '../exercises';
import { BRIDGES, NOMS_ARCHIPELS, getArchipelago, isBiomeUnlocked, islandsOf } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipels';
import { toutConstruit } from './budget';
import {
  borneTouchee,
  capVers,
  embarquer,
  etapeDuVoyage,
  finDuTemps,
  ileDeLOuvrage,
  missionsDe,
  modeleDuMonde,
  nouveauVoyage,
  versLArrivee,
  voyageAJouer,
  type Voyage,
} from './modele';
import { questStations } from './terrain';

const vierge: BloclandState = EMPTY_STATE;
const fini = (): BloclandState => ({ ...EMPTY_STATE, ...toutConstruit() }) as BloclandState;

it('les missions d’une île sont celles de ses bornes, dans le même ordre', () => {
  for (const b of BIOMES) expect(missionsDe(b.id), b.id).toEqual(questStations(b.id).map((s) => s.typeId));
});

it('l’état des bornes est celui que calculait la page du monde', () => {
  for (const state of [vierge, fini()])
    for (const a of ARCHIPELAGO_IDS) {
      const attendu = islandsOf(a).flatMap((b) =>
        questStations(b.id).map((st) => {
          const open = isBiomeUnlocked(b.id, state.village.bridges);
          const def = open ? pickExercise(b.id, st.typeId, levelFor(state, st.typeId), state.progress) : undefined;
          const progress = def ? questProgress(b.id, st.typeId, state.progress) : undefined;
          return { id: `${b.id}:${st.typeId}`, ile: b.id, mission: st.typeId, etat: !def ? 'locked' : progress ? progress.stars : 'new' };
        }),
      );
      expect(modeleDuMonde(state, a, NOMS_ARCHIPELS).bornes).toEqual(attendu);
    }
});

it('les îles du modèle : ouvertes ou non, et leur état', () => {
  const m = modeleDuMonde(vierge, '6e', NOMS_ARCHIPELS);
  expect(m.iles.map((i) => i.id)).toEqual(islandsOf('6e').map((b) => b.id));
  expect(m.iles.find((i) => i.id === 'foret')).toMatchObject({ ouverte: true, etat: { id: 'a-explorer' } });
  expect(m.iles.find((i) => i.id === 'mine')).toMatchObject({ ouverte: false, etat: { id: 'fermee' } });
});

it('une borne touchée : jouer si elle est jouable, sinon ouvrir son île', () => {
  const { bornes } = modeleDuMonde(vierge, '6e', NOMS_ARCHIPELS);
  const ouverte = bornes.find((b) => b.ile === 'foret')!;
  const fermee = bornes.find((b) => b.ile === 'mine')!;
  expect(borneTouchee(bornes, 'foret', ouverte.mission)).toBe('jouer');
  expect(borneTouchee(bornes, 'mine', fermee.mission)).toBe('ile');
  expect(borneTouchee(bornes, 'foret', 'inconnue')).toBe('ile');
});

it('un ouvrage touché ouvre l’île ouverte qu’il touche', () => {
  const b = BRIDGES.find((x) => x.from === 'foret' || x.to === 'foret')!;
  expect(ileDeLOuvrage(b.id, [])).toBe('foret');
  expect(ileDeLOuvrage('inconnu', [])).toBeNull();
});

it('le cap vers une île : dans l’archipel, en voyage, ou le port quand elle est fermée', () => {
  const { village } = toutConstruit();
  expect(capVers('mine', '6e', [])).toBe('archipel');
  expect(capVers('marche', '6e', [])).toBe('port');
  expect(capVers('marche', '6e', village.bridges)).toBe('voyage');
});

describe('la machine du voyage', () => {
  const p = { to: '5e' as const, from: '6e' as const, back: false, dest: getArchipelago('5e').port, bridges: [], reduceMotion: false, approach: false };

  it('l’écran fixe quand l’appareil demande moins d’animations', () => {
    expect(nouveauVoyage({ ...p, reduceMotion: true }, null)).toMatchObject({ mode: 'panel', seq: 0, leg: 'depart', approach: false, stage: 1 });
    expect(finDuTemps(nouveauVoyage({ ...p, reduceMotion: true }, null))).toBeNull();
  });

  it('la cinématique : marcher au port, embarquer, changer d’archipel, arriver', () => {
    const marche = nouveauVoyage({ ...p, approach: true }, null);
    expect(marche).toMatchObject({ mode: 'cinema', seq: 0, approach: true });
    expect(voyageAJouer(marche)).toBeNull();
    expect(finDuTemps(marche)).toBe('embarquer');
    const depart = embarquer(marche) as Voyage;
    expect(depart).toMatchObject({ approach: false, seq: 1, leg: 'depart' });
    expect(voyageAJouer(depart)).toEqual({ seq: 1, leg: 'depart', stage: 1, back: false });
    expect(finDuTemps(depart)).toBe('changer-d-archipel');
    const arrivee = versLArrivee(depart) as Voyage;
    expect(arrivee).toMatchObject({ leg: 'arrivee', seq: 2 });
    expect(finDuTemps(arrivee)).toBe('arriver');
    expect(embarquer(arrivee)).toBe(arrivee);
  });

  it('déjà au port : le départ commence tout de suite', () => {
    expect(nouveauVoyage(p, { ...nouveauVoyage(p, null), seq: 4 })).toMatchObject({ seq: 5, approach: false });
  });

  it('l’étape du navire : celle qui mène là-bas ; pour un retour, la plus grande déjà partie', () => {
    expect(etapeDuVoyage('5e', false, [])).toBe(1);
    expect(etapeDuVoyage('3e', false, [])).toBe(3);
    expect(etapeDuVoyage('6e', true, [])).toBe(1);
    expect(etapeDuVoyage('6e', true, toutConstruit().village.bridges)).toBe(3);
  });
});
