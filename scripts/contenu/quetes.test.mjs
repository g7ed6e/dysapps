import { readFileSync } from 'node:fs';
import { FICHIER_QUETES, lireQuetes, verifierQuetes } from './quetes.mjs';

/** Les îles du jeu (src/game/islands.ts), dans l'ordre de docs/contenu/archipel.md. */
function ilesDuJeu() {
  const texte = readFileSync('src/game/islands.ts', 'utf8');
  return JSON.parse(texte.slice(texte.indexOf('= [') + 2, texte.lastIndexOf(' satisfies')));
}
const ILES = ilesDuJeu();
const DEMANDES = JSON.parse(readFileSync('src/game/world/requests.json', 'utf8'));
const BLOCS = [...ILES.map((b) => b.block), 'lantern', 'door', 'stairs'];
const PROJETS = [{ monument: 'landmark-5e-1', classe: '5e' }];

const quete = (...etapes) =>
  ['# Les quêtes', '', '## 6e', '', '### `story-6e-1`', '', '- objet : la lanterne', '- icône : `lantern`', '- fin : Lanterne posée chez Mousso !', '', ...etapes, ''].join('\n');
const BONNES = [
  '1. mission chez `maths-6e-calculation` : Joue une mission chez Coco.',
  '2. donner 2 `french-6e-phonology` chez `maths-6e-calculation` : Donne {objet} à Coco.',
  '3. apporter chez `french-6e-phonology` : Apporte la lanterne à Mousso.',
];
const verifier = (...etapes) => () => verifierQuetes(lireQuetes(quete(...etapes), 'quetes.md'), ILES, DEMANDES, BLOCS);

describe('docs/contenu/quetes.md', () => {
  it('le fichier du dépôt se lit et se vérifie', () => {
    const q = verifierQuetes(lireQuetes(readFileSync(`docs/contenu/${FICHIER_QUETES}`, 'utf8'), FICHIER_QUETES), ILES, DEMANDES, BLOCS, PROJETS);
    expect(q.length).toBeGreaterThanOrEqual(3);
  });
  it('la dernière quête d’une région peut montrer son projet, avec « projet » et « voir » ensemble', () => {
    const avec = (...champs) => () => verifierQuetes(lireQuetes(quete(...champs, '', ...BONNES), 'quetes.md'), ILES, DEMANDES, BLOCS, PROJETS);
    expect(avec('- projet : `landmark-5e-1`')).toThrow(/vont ensemble/);
    expect(avec('- projet : `landmark-5e-1`', '- voir : Voir le phare')).toThrow(/en 5e, la quête en 6e/);
    expect(avec('- projet : `landmark-6e-1`', '- voir : Voir le phare')).toThrow(/pas un grand projet/);
    const phare = [{ monument: 'landmark-6e-1', classe: '6e' }];
    const q = verifierQuetes(lireQuetes(quete('- projet : `landmark-6e-1`', '- voir : Voir le phare', '', ...BONNES), 'quetes.md'), ILES, DEMANDES, BLOCS, phare);
    expect(q[0]).toMatchObject({ project: 'landmark-6e-1', see: 'Voir le phare' });
  });
  it('l’objet posé est la petite construction suivante de l’habitant, après celle de sa commande', () => {
    expect(verifier(...BONNES)()[0].fixture).toBe('french-6e-phonology-fixture-2');
  });
  it('trois ou quatre étapes', () => {
    expect(verifier(BONNES[0], BONNES[2].replace('3.', '2.'))).toThrow(/trois ou quatre étapes/);
  });
  it('la dernière étape se fait d’un toucher', () => {
    expect(verifier(BONNES[0], BONNES[1], '3. mission chez `french-6e-phonology` : Joue une mission chez Mousso.')).toThrow(/dernière étape/);
  });
  it('la phrase nomme l’habitant, en sept mots au plus', () => {
    expect(verifier('1. mission chez `maths-6e-calculation` : Joue une mission chez Mousso.', BONNES[1], BONNES[2])).toThrow(/nomme l’habitant/);
    expect(verifier('1. mission chez `maths-6e-calculation` : Joue une belle mission de calcul chez Coco.', BONNES[1], BONNES[2])).toThrow(/sept mots/);
  });
  it('« donner » : de 2 à 4 blocs d’un lieu de la région, dits par {objet}', () => {
    expect(verifier(BONNES[0], '2. donner 5 `french-6e-phonology` chez `maths-6e-calculation` : Donne {objet} à Coco.', BONNES[2])).toThrow(/de 2 à 4/);
    expect(verifier(BONNES[0], '2. donner 2 `french-6e-phonology` chez `maths-6e-calculation` : Donne du bois à Coco.', BONNES[2])).toThrow(/\{objet\}/);
  });
  it('jamais un lieu d’une autre région', () => {
    expect(verifier('1. mission chez `maths-5e-signed-numbers` : Joue une mission chez Coco.', BONNES[1], BONNES[2])).toThrow(/en 5e/);
  });
});
