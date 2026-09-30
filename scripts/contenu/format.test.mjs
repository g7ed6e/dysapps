import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clesDeplacees, clesRemplacees } from './chemins.mjs';
import { ecrireIle, lireIle } from './format.mjs';

const DATA = 'src/blocland/exercises/data';

/** Les exercices du jeu, rangés par île. */
function parIle() {
  const iles = new Map();
  for (const f of readdirSync(DATA).sort()) {
    const ex = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    if (!iles.has(ex.biome)) iles.set(ex.biome, []);
    iles.get(ex.biome).push(ex);
  }
  return iles;
}

describe('le format Markdown du contenu', () => {
  it('écrit puis relit chaque exercice du jeu sans rien perdre', () => {
    for (const [ile, exercices] of parIle()) {
      const md = ecrireIle({ id: ile }, exercices);
      const relu = lireIle(md, `${ile}.md`);
      expect(relu.ile).toBe(ile);
      expect(relu.exercices).toEqual(exercices);
    }
  });

  it('donne la ligne fautive quand un champ est inconnu', () => {
    const md = ['---', 'île : baie', '---', '', '## X · `x`', '', '### Niveau 1 · `baie-x-1`', '- couleur : bleu', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('baie.md, ligne 8 : champ inconnu « couleur »');
  });

  it('refuse un champ donné pour la mission et répété dans un niveau', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '- langue : en', '### Niveau 1 · `baie-x-1`', '- langue : fr', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('« langue » est déjà donné pour toute la mission');
  });

  it('refuse un item mal numéroté', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', '', '2. mot : chat', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('item 1 attendu, lu 2');
  });

  it('garde les cas limites à l’aller-retour', () => {
    const items = Array.from({ length: 14 }, (_, n) => ({ key: `baie-x-1-${n}`, prompt: `mot ${n}`, choices: ['a · b', 'c'], answer: 'c' }));
    items[0].hint = ' espace en tête';
    items[1].hint = '"entre guillemets"';
    items[2].hint = 'deux : points et « chevrons »';
    items[3].choices = [];
    items[4].aid = { kind: 'rule-card', props: { title: 'Règle : x', lines: ['une ligne'] } };
    items[5].explanation = '';
    const ex = { id: 'baie-x-1', biome: 'baie', type: 'x', level: 1, instruction: 'Consigne.', items };
    const md = ecrireIle({ id: 'baie' }, [ex]);
    expect(lireIle(md).exercices).toEqual([ex]);
    expect(lireIle(md.replace(/\n/g, '\r\n')).exercices).toEqual([ex]);
    expect(lireIle('\uFEFF' + md).exercices).toEqual([ex]);
  });

  it('refuse une valeur vide ou avec des espaces au bord écrite sans guillemets', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '- consigne : texte  ', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('écrire entre guillemets');
  });

  it('refuse un nombre mal écrit et un identifiant qui sortirait du dossier', () => {
    expect(() => lireIle(['---', 'île : baie', '---', '## X · `x`', '- blocs : 0x10', ''].join('\n'))).toThrow('nombre attendu');
    expect(() => lireIle(['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `../../tmp/a`', ''].join('\n'))).toThrow('identifiant d’exercice mal écrit');
  });

  it('repère une clé d’item qui désignerait un autre item', () => {
    const avant = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'chien' }] };
    const apres = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'lapin' }, { key: 'e-2', word: 'chien' }] };
    expect(clesDeplacees(avant, apres)).toEqual(['e-2']);
    expect(clesDeplacees(avant, { items: [...avant.items, { key: 'e-2', word: 'lapin' }] })).toEqual([]);
  });

  it('refuse deux items qui auraient la même clé', () => {
    // A, N, B, C : B et C ont repris leurs anciennes clés, N reçoit la clé par défaut x-1, déjà prise par B.
    const md = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', '', '1. mot : A', '2. mot : N', '3. clé : baie-x-1-1', '   - mot : B', '4. clé : baie-x-1-2', '   - mot : C', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('les items 2 et 3 ont la même clé « baie-x-1-1 »');
  });

  it('laisse corriger la faute d’un item sans changer sa place', () => {
    const avant = { items: [{ key: 'e-0', word: 'chta' }, { key: 'e-1', word: 'chien' }] };
    expect(clesDeplacees(avant, { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'chien' }] })).toEqual([]);
  });

  it('déduit la clé, la lecture du trou et le mot troué, et lit les tableaux', () => {
    const md = [
      '---', 'île : baie', '---', '## X · `x`', '',
      'Pour tous les items :', '- clé des items : mot', '- trou lu : blank', '',
      '### Niveau 1 · `baie-x-1`', '',
      '| mot troué | énoncé | choix |', '| --- | --- | --- |',
      '| [en]fant | Un … ici. | en · an |', '| p[an]talon |  | an · en |', '',
      '### Niveau 2 · `baie-x-2`', '',
      'Pour tous les items :', '- clé des items : paragraphe', '',
      '1. texte : Premier paragraphe.', '2. texte : Second.', '   - lu : autre lecture', '',
    ].join('\n');
    const [un, deux] = lireIle(md, 'baie.md').exercices;
    expect(un.items).toEqual([
      { key: 'enfant', prompt: 'Un … ici.', word: 'enfant', before: '', after: 'fant', spoken: 'Un blank ici.', choices: ['en', 'an'], answer: 'en' },
      { key: 'pantalon', word: 'pantalon', before: 'p', after: 'talon', choices: ['an', 'en'], answer: 'an' },
    ]);
    expect(deux.items).toEqual([{ key: 'p1', text: 'Premier paragraphe.' }, { key: 'p2', text: 'Second.', spoken: 'autre lecture' }]);
    expect(lireIle(ecrireIle({ id: 'baie' }, [un, deux])).exercices).toEqual([un, deux]);
  });

  it('refuse un tableau mal formé ou mêlé à des items numérotés', () => {
    const debut = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', ''];
    const lire = (...l) => () => lireIle([...debut, ...l, ''].join('\n'), 'baie.md');
    expect(lire('| mot | choix |', '| --- | --- |', '| chat |')).toThrow('2 cases attendues, lu 1');
    expect(lire('| couleur |', '| --- |', '| bleu |')).toThrow('colonne inconnue « couleur »');
    expect(lire('| mot |', '| chat |')).toThrow('ligne « |---|---| » attendue');
    expect(lire('1. mot : chat', '| mot |', '| --- |', '| chien |')).toThrow('pas les deux');
    expect(lire('| mot |', '| --- |', '| chat |', '2. mot : chien')).toThrow('pas les deux');
    expect(lire('1. mot : chat', '   - trou lu : blank')).toThrow('va dans « Pour tous les items »');
    expect(lire('Pour tous les items :', '- clé des items : rang', '', '1. mot : chat')).toThrow('« clé des items » vaut');
    expect(lire('Pour tous les items :', '- clé des items : mot', '', '1. texte : sans mot')).toThrow('n’a pas de mot pour faire sa clé');
    expect(lire('1. mot troué : enfant')).toThrow('mot troué attendu sous la forme « en[f]ant »');
  });

  it('refuse les écritures ambiguës autour des tableaux et des règles', () => {
    const debut = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', ''];
    const lire = (...l) => () => lireIle([...debut, ...l, ''].join('\n'), 'baie.md');
    expect(lire('| mot |', '| --- |', '| chat |', '| chien |', '', 'Pour tous les items :', '- réponse : X')).toThrow('va avant le premier item');
    expect(lire('Pour tous les items :', '- clé des items : mot', '', '| mot |', '| --- |', '| chat |', '| chat |')).toThrow('ont la même clé « chat »');
    expect(lire('Pour tous les items :', '- réponse : z', '', '1. mot troué : en[f]ant')).toThrow('« mot troué » donne déjà « réponse »');
    expect(lire('| mot |', '| --- |', '| chat |', '- langue : en')).toThrow('un champ du niveau va avant ses items');
    const deux = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', '', 'Pour tous les items :', '- réponse : z', '', '1. mot : a', '', '## Y · `y`', 'Pour tous les items :', '- mot troué : en[f]ant', ''].join('\n');
    expect(() => lireIle(deux)).not.toThrow();
    const md = ['---', 'île : baie', '---', '## X · `x`', 'Pour tous les items :', '- trou lu : blank', '', '### Niveau 1 · `baie-x-1`', '', 'Pour tous les items :', '- trou lu : (mot manquant)', '', '1. énoncé : Il … ici.', ''].join('\n');
    expect(lireIle(md).exercices[0].items[0].spoken).toBe('Il (mot manquant) ici.');
  });

  it('écrit une liste vide hors du tableau', () => {
    const ex = { id: 'baie-x-1', biome: 'baie', type: 'x', level: 1, items: [{ key: 'baie-x-1-0', word: 'a', choices: [] }, { key: 'baie-x-1-1', word: 'b', choices: ['c'] }] };
    expect(lireIle(ecrireIle({ id: 'baie' }, [ex])).exercices).toEqual([ex]);
  });

  it('signale une clé remplacée par une autre au même rang', () => {
    const avant = { items: [{ key: 'chta', word: 'chta' }, { key: 'chien', word: 'chien' }] };
    expect(clesRemplacees(avant, { items: [{ key: 'chat', word: 'chat' }, { key: 'chien', word: 'chien' }] })).toEqual(['chta → chat']);
  });

  it('écrit puis relit chaque île du jeu, ses missions et son en-tête', () => {
    const iles = JSON.parse(readFileSync('src/blocland/iles.json', 'utf8'));
    const exercices = parIle();
    for (const ile of iles) {
      const relu = lireIle(ecrireIle(ile, exercices.get(ile.id) ?? []), `${ile.id}.md`);
      expect(relu.biome).toEqual(ile);
      const parId = (liste) => [...liste].sort((a, b) => a.id.localeCompare(b.id));
      expect(parId(relu.exercices)).toEqual(parId(exercices.get(ile.id) ?? []));
    }
  });

  it('refuse un en-tête ou un champ de mission mal écrit', () => {
    expect(() => lireIle(['---', 'île : baie', 'couleur : bleu', '---', ''].join('\n'), 'baie.md')).toThrow('champ d’en-tête inconnu « couleur »');
    expect(() => lireIle(['---', 'île : baie', 'bloc : a', 'bloc : b', '---', ''].join('\n'), 'baie.md')).toThrow('« bloc » écrit deux fois');
    expect(() => lireIle(['---', 'île : baie', '---', '# A', '# B', ''].join('\n'), 'baie.md')).toThrow('l’île a un seul titre');
    const md = ['---', 'île : baie', '---', '## X · `x`', '- description : a', '- description : b', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('« description » écrit deux fois');
    const niveau = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', '- compétences : c3.x', ''].join('\n');
    expect(() => lireIle(niveau, 'baie.md')).toThrow('champ inconnu « compétences »');
  });

  it('ne voit aucun glissement quand une île passe en Markdown', () => {
    for (const [ile, exercices] of parIle()) {
      const relu = lireIle(ecrireIle({ id: ile }, exercices)).exercices;
      exercices.forEach((ex, n) => expect(clesDeplacees(ex, relu[n])).toEqual([]));
    }
  });
});
