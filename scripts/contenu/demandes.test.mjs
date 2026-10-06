import { readFileSync } from 'node:fs';
import { DEMANDES, produire } from './chemins.mjs';
import { ecrireIle, lireIle } from './format.mjs';
import { verifierDemandes } from './demandes.mjs';

const debut = ['---', 'lieu : french-6e-letter-confusion', '---', '', '# Mine', '', '## Les plans', '', '| plan | nom | XP | quand c’est bâti |', '| --- | --- | --- | --- |', '| `french-6e-letter-confusion-1` | La forge | 50 | Fini. |', '', '## Les demandes', ''];
const tunel = [
  '### `french-6e-letter-confusion-request-1`',
  '',
  '- habitant : Tunel',
  '- bloc : `maths-6e-calculation`',
  '- combien : 4',
  '- petite construction : le puits',
  '- demande : Il me faut {objet} pour mon puits. Joue une mission de la Plaine des nombres.',
  '- prête : Tu as les {blocs} ! Livre-les à Tunel.',
  '- posée : Puits posé chez Tunel !',
];
const lire = (...l) => () => lireIle([...debut, ...l, ''].join('\n'), 'french-6e-letter-confusion.md');
const remplacer = (avant, apres) => tunel.map((l) => (l.startsWith(avant) ? apres : l));

/** Les îles du jeu (src/game/islands.ts), dans l'ordre de docs/contenu/archipel.md. */
function ilesDuJeu() {
  const texte = readFileSync('src/game/islands.ts', 'utf8');
  return JSON.parse(texte.slice(texte.indexOf('= [') + 2, texte.lastIndexOf(' satisfies')));
}

const RECETTES = [
  { bloc: 'compound-6e', archipelago: '6e', ingredients: [{ bloc: 'french-6e-phonology', n: 2 }, { bloc: 'maths-6e-calculation', n: 1 }] },
  { bloc: 'compound-5e', archipelago: '5e', ingredients: [{ bloc: 'maths-5e-signed-numbers', n: 2 }, { bloc: 'french-5e-homophones', n: 1 }] },
  { bloc: 'compound-3e', archipelago: '3e', ingredients: [{ bloc: 'french-3e-close-reading', n: 2 }, { bloc: 'maths-3e-statistics', n: 1 }] },
  { bloc: 'compound-4e', archipelago: '4e', ingredients: [{ bloc: 'maths-4e-powers', n: 2 }, { bloc: 'english-4e-grammar', n: 1 }] },
];

/** Vérifie toutes les commandes de docs/contenu/, celle de la Mine remplacée par `lignes`. */
function verifier(lignes) {
  const iles = ilesDuJeu();
  const parIle = new Map();
  const plans = new Map();
  for (const b of iles) {
    const lu = lireIle(readFileSync(`docs/contenu/${b.id}.md`, 'utf8'), `${b.id}.md`);
    parIle.set(b.id, lu.demandes);
    plans.set(b.id, lu.plans.map((p) => p.id));
  }
  parIle.set('french-6e-letter-confusion', lireIle([...debut, ...lignes, ''].join('\n'), 'french-6e-letter-confusion.md').demandes);
  return () => verifierDemandes(iles, parIle, RECETTES, plans);
}

describe('les commandes des habitants en Markdown', () => {
  it('lit une commande, et la réécrit à l’identique', () => {
    const [d] = lire(...tunel).call().demandes;
    expect(d).toEqual({
      id: 'french-6e-letter-confusion-request-1',
      biome: 'french-6e-letter-confusion',
      block: 'maths-6e-calculation',
      count: 4,
      fixture: 'french-6e-letter-confusion-fixture-1',
      blocland: {
        name: 'le puits',
        ask: 'Il me faut {objet} pour mon puits. Joue une mission de la Plaine des nombres.',
        ready: 'Tu as les {blocs} ! Livre-les à Tunel.',
        done: 'Puits posé chez Tunel !',
      },
      resident: 'Tunel',
    });
    expect(lireIle(ecrireIle({ id: 'french-6e-letter-confusion' }, [], [], [d])).demandes).toEqual([d]);
    const { resident, ...json } = d;
    expect(resident).toBe('Tunel');
    expect(verifier(tunel).call().find((x) => x.biome === 'french-6e-letter-confusion')).toEqual(json);
  });

  it('refuse une commande mal écrite, avec la ligne', () => {
    expect(lire('### french-6e-letter-confusion-request-1')).toThrow('ligne 15 : identifiant de commande attendu');
    expect(lire(...tunel.map((l) => l.replace('request-1', 'request-2')))).toThrow('identifiant « french-6e-letter-confusion-request-1 » attendu');
    expect(lire(...remplacer('- combien', '- combien : 5'))).toThrow('combien : un nombre de 2 à 4 attendu');
    expect(lire(...remplacer('- combien', '- combien : 1'))).toThrow('combien : un nombre de 2 à 4 attendu');
    expect(lire(...remplacer('- bloc', '- bloc : maths-6e-calculation'))).toThrow('bloc : identifiant attendu entre accents graves');
    expect(lire(...tunel, '- couleur : rouge')).toThrow('champ inconnu « couleur »');
    expect(lire(...tunel, '- combien : 3')).toThrow('« combien » écrit deux fois');
    expect(lire(...tunel.filter((l) => !l.startsWith('- posée')))).toThrow('commande french-6e-letter-confusion-request-1 : « posée » manque');
    expect(lire('- habitant : Tunel')).toThrow('un champ va sous le titre d’une commande');
    expect(() => lireIle([...debut.slice(0, 6), '## Les demandes', '', '## Les plans', ''].join('\n'), 'x.md')).toThrow('« ## Les demandes » vient après « ## Les plans »');
  });

  it('garde les règles de GD-7 : qui demande, quel bloc, quelles phrases', () => {
    expect(verifier(remplacer('- habitant', '- habitant : Coco'))).toThrow('l’habitant est la créature de l’île, Tunel');
    expect(verifier(remplacer('- bloc', '- bloc : `french-6e-letter-confusion`'))).toThrow('pas le bloc de sa propre île');
    expect(verifier(remplacer('- bloc', '- bloc : `maths-5e-signed-numbers`'))).toThrow('vient d’un autre archipel');
    expect(verifier(remplacer('- bloc', '- bloc : `trophy-gold`'))).toThrow('ni celui d’une île ni un bloc assemblé');
    expect(verifier(remplacer('- bloc', '- bloc : `lantern`'))).toThrow('ni celui d’une île ni un bloc assemblé');
    expect(verifier(remplacer('- bloc', '- bloc : `compound-5e`'))).toThrow('celui de l’archipel 5e');
    const cadrans = remplacer('- bloc', '- bloc : `english-6e-grammar`').map((l) => (l.startsWith('- demande') ? '- demande : Il me faut {objet} pour mon puits. Joue une mission de l’Horloge des verbes.' : l));
    expect(verifier(cadrans)).toThrow('commande english-6e-vocabulary-request-1 : le bloc « english-6e-grammar » est déjà demandé dans l’archipel');
    expect(verifier(remplacer('- demande', '- demande : Il me faut {objet} pour mon puits. Joue une mission de la Forêt des sons.'))).toThrow('le lieu et le geste');
    expect(verifier(remplacer('- demande', '- demande : Il me faut 4 briques pour mon puits. Joue une mission de la Plaine des nombres.'))).toThrow('« {objet} » une fois');
    expect(verifier(remplacer('- demande', '- demande : Il me faut {objet} pour mon puits… Joue une mission de la Plaine des nombres.'))).toThrow('pas de « … »');
    expect(verifier(remplacer('- demande', '- demande : Il me faut {objet} pour ma margelle. Joue une mission de la Plaine des nombres.'))).toThrow('le même nom partout, « puits »');
    expect(verifier(remplacer('- prête', "- prête : Tu as les {blocs} ! Livre-les à Tunel, l'ami."))).toThrow('jamais droits');
    expect(verifier(remplacer('- prête', '- prête : Tu as les {nombre} ! Livre-les à Tunel.'))).toThrow('jeton inconnu {nombre}');
    expect(verifier(remplacer('- posée', '- posée : Puits posé chez Coco !'))).toThrow('posée : « Puits posé(e) chez Tunel ! »');
    expect(verifier([...tunel, '- après le plan : `french-6e-reading-2`'])).toThrow('n’est pas un plan de l’île');
  });

  it('suit docs/contenu/ : une commande par île de français, de maths, d’anglais et d’histoire-géographie, aucune en LV2', () => {
    const { sortie } = produire();
    const demandes = JSON.parse(sortie.get(DEMANDES));
    expect(readFileSync(DEMANDES, 'utf8')).toBe(sortie.get(DEMANDES));
    const scolaires = ilesDuJeu().filter((b) => b.subject !== 'lv2');
    expect(scolaires).toHaveLength(36);
    expect(demandes.map((d) => d.biome)).toEqual(scolaires.map((b) => b.id));
    expect(new Set(demandes.map((d) => d.id)).size).toBe(demandes.length);
    expect(new Set(demandes.map((d) => d.fixture)).size).toBe(demandes.length);
    for (const d of demandes) {
      expect(d.block).not.toMatch(/^(trophy-|lv2-)/);
      expect(d.count).toBeGreaterThanOrEqual(2);
      expect(d.count).toBeLessThanOrEqual(4);
    }
    // Grimoire ne commande qu'une fois « La lanterne du phare » bâtie (arbitrage du directeur artistique, 3 octobre 2026).
    expect(demandes.filter((d) => d.afterPlan).map((d) => [d.id, d.afterPlan])).toEqual([['french-6e-reading-request-1', 'french-6e-reading-2']]);
  });
});
