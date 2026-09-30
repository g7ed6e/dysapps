import { readFileSync } from 'node:fs';
import { MISSIONS_PORTAIL } from './portail.mjs';

const mission = (id) => MISSIONS_PORTAIL.find((m) => m.id === id);

describe('les missions du portail en Markdown', () => {
  it('écrivent puis relisent chaque JSON du portail à l’identique', () => {
    for (const m of MISSIONS_PORTAIL) {
      const json = readFileSync(m.json, 'utf8');
      const relu = m.lire(m.ecrire(JSON.parse(json)), `${m.id}.md`);
      expect(JSON.stringify(relu, null, 2) + '\n').toBe(json);
    }
  });

  it('refusent un en-tête, un champ ou un tableau mal écrit, avec la ligne', () => {
    const h = mission('homophones');
    const debut = ['---', 'portail : homophones', '---', '', '# Homophones', '', '## a / à · `a`', ''];
    const lire = (...l) => () => h.lire([...debut, ...l, ''].join('\n'), 'homophones.md');
    expect(() => h.lire('---\nportail : lecture\n---\n', 'homophones.md')).toThrow('l’en-tête attendu');
    expect(lire('- niveau : 1', '- choix : a · à', '- couleur : bleu')).toThrow('homophones.md, ligne 11 : champ inconnu « couleur »');
    expect(lire('- niveau : 1', '- choix : a · à', '| phrase | réponse |', '| --- | --- |')).toThrow('« indice » manque');
    expect(lire('- niveau : un', '- choix : a · à', '- indice : x', '', '| phrase | réponse |', '| --- | --- |')).toThrow('nombre attendu');
    expect(lire('- niveau : 1', '- choix : a · à', '- indice : x', '', '| phrase | réponse |', '| --- | --- |', '| Il … là. |')).toThrow('2 cases attendues, lu 1');
    expect(() => mission('verbes-irreguliers').lire(['---', 'portail : verbes-irreguliers', '---', '# V', '| base |', '| --- |', ''].join('\n'), 'v.md')).toThrow('colonnes attendues');
  });

  it('refusent un identifiant écrit deux fois et disent le fichier d’une chaîne mal écrite', () => {
    const v = mission('vocabulaire');
    const theme = (id, fr = 'rouge') => [`## Couleurs · \`${id}\``, '', '| anglais | français | pièges |', '| --- | --- | --- |', `| red | ${fr} | read · rad |`, ''];
    const lire = (...l) => () => v.lire(['---', 'portail : vocabulaire', '---', '', '# V', '', ...l].join('\n'), 'vocabulaire.md');
    expect(lire(...theme('couleurs'), ...theme('couleurs'))).toThrow('vocabulaire.md, ligne 13 : l’identifiant « couleurs » est écrit deux fois');
    expect(lire(...theme('couleurs', '"rouge'))).toThrow(/^vocabulaire\.md, ligne 11/);
  });

  it('refusent d’écrire une valeur qui ne tiendrait pas dans une case', () => {
    expect(() => mission('vocabulaire').ecrire([{ id: 'x', label: 'X', words: [{ en: 'a | b', fr: 'c', traps: ['d'] }] }])).toThrow('ne tient pas dans une case');
    expect(() => mission('lecture').ecrire([{ id: 'x', title: 'X', author: 'A', source: 'S', kind: 'prose', paragraphs: [['- tiret']], glossary: [], questions: [] }])).toThrow('ligne de texte à revoir');
  });
});
