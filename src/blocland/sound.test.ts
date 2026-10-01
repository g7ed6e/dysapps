// Le « clac » de pose de Blocland (GD-1, point 4, conditions du référent dys) : court, à hauteur fixe (rien ne monte ni
// ne descend), distinct du « toc » commun, qui reste celui d'Archipéo.
import { CLAC, playClac, playPlace, sonDePose } from './sound';

/** Un faux contexte Web Audio qui note les rampes de fréquence et les arrêts. */
function fauxAudio() {
  const rampes: string[] = [];
  const arrets: number[] = [];
  const param = (nom: string) => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => rampes.push(nom),
    exponentialRampToValueAtTime: () => rampes.push(nom),
  });
  const noeud = () => ({ connect: (n: unknown) => n });
  class Contexte {
    state = 'running';
    currentTime = 0;
    sampleRate = 8000;
    destination = {};
    createOscillator = () => ({ ...noeud(), type: '', frequency: param('frequence'), start: () => {}, stop: (t: number) => arrets.push(t) });
    createGain = () => ({ ...noeud(), gain: param('volume') });
    createBiquadFilter = () => ({ ...noeud(), type: '', frequency: param('filtre'), Q: param('q') });
    createBufferSource = () => ({ ...noeud(), buffer: null, start: () => {}, stop: (t: number) => arrets.push(t) });
    createBuffer = (_c: number, n: number, rate: number) => ({ sampleRate: rate, getChannelData: () => new Float32Array(n) });
    resume = () => Promise.resolve();
  }
  return { rampes, arrets, Contexte };
}

// Le contexte est créé une fois par sound.ts, puis gardé : un seul faux pour tout le fichier, vidé entre les tests.
const audio = fauxAudio();
beforeEach(() => {
  vi.stubGlobal('AudioContext', audio.Contexte);
  audio.rampes.length = 0;
  audio.arrets.length = 0;
});
afterEach(() => vi.unstubAllGlobals());

it('le « clac » sonne à hauteur fixe et s’éteint en moins d’un dixième de seconde', () => {
  const { rampes, arrets } = audio;
  playClac();
  expect(rampes.filter((r) => r === 'frequence' || r === 'filtre')).toEqual([]);
  expect(rampes).toContain('volume');
  expect(Math.max(...arrets)).toBeLessThan(0.1);
  expect(CLAC.duree).toBeLessThan(0.1);
});

it('le « toc » commun, lui, descend : les deux sons se distinguent', () => {
  const { rampes } = audio;
  playPlace();
  expect(rampes).toContain('frequence');
});

it('Blocland pose avec le « clac », Archipéo avec le « toc »', () => {
  expect(sonDePose('geste')).toBe(playClac);
  expect(sonDePose('eclats')).toBe(playPlace);
});
