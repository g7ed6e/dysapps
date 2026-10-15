import { ecrireIle, lireIle } from './format.mjs';

const ENTETE = ['---', 'lieu : lca-5e-legends', 'matière : lca', 'classe : 5e', '---', '', '# Grotte des légendes', ''];
const MISSION = ['## Les cas latins · `la-cases`', '', '- description : Les cas.', '- compétences : c4.la.langue.cas-fonctions', '- option : la', ''];
const VOIX = ['## La voix', '', '| mot | langue | lu |', '| --- | --- | --- |', '| rosam | la | rossamm |', '| philos | grc-Latn | filoss |', '| notte | it |  |', ''];

describe('l’île du latin et du grec dans le Markdown (GD-13)', () => {
  it('lit l’option d’une mission, une mission en attente, et la voix de l’île, puis les réécrit', () => {
    const attente = ['## L’alphabet grec · `gr-alphabet`', '', '- description : Les lettres.', '- compétences : c4.gr.langue.alphabet', '- option : gr', '- en attente : la police grecque', ''];
    const md = [...ENTETE, ...MISSION, ...attente, ...VOIX].join('\n');
    const { biome } = lireIle(md, 'lca-5e-legends.md');
    expect(biome.exercises.map((m) => [m.id, m.option, m.waiting])).toEqual([
      ['la-cases', 'la', undefined],
      ['gr-alphabet', 'gr', 'la police grecque'],
    ]);
    expect(biome.foreignWords).toEqual([
      { word: 'rosam', lang: 'la', spoken: 'rossamm' },
      { word: 'philos', lang: 'grc-Latn', spoken: 'filoss' },
      { word: 'notte', lang: 'it' },
    ]);
    expect(lireIle(ecrireIle(biome, [])).biome.foreignWords).toEqual(biome.foreignWords);
  });

  it('la voix vient avant les plans', () => {
    const plans = ['## Les plans', '', '| plan | nom | XP | quand c’est bâti |', '| --- | --- | --- | --- |', '| `lca-5e-legends-1` | L’abri de Lyre | 40 | Fini ! |', ''];
    expect(lireIle([...ENTETE, ...MISSION, ...VOIX, ...plans].join('\n')).plans).toHaveLength(1);
    expect(() => lireIle([...ENTETE, ...MISSION, ...plans, ...VOIX].join('\n'), 'x.md')).toThrow('« ## Les plans » vient après « ## La voix »');
  });

  it('refuse une voix mal écrite : le latin et le grec ont leur « lu », une langue vivante non', () => {
    const avec = (rangee) => [...ENTETE, ...MISSION, '## La voix', '', '| mot | langue | lu |', '| --- | --- | --- |', rangee, ''].join('\n');
    expect(() => lireIle(avec('| rosam | la |  |'), 'x.md')).toThrow('écrire dans « lu »');
    expect(() => lireIle(avec('| notte | it | notté |'), 'x.md')).toThrow('lu par la voix de sa langue');
    expect(() => lireIle(avec('| rosa | grec |  |'), 'x.md')).toThrow('langue « grec » inconnue');
  });
});
