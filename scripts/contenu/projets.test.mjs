import { readFileSync } from 'node:fs';
import { FICHIER_PROJETS, lireBanques, lireProjets, verifierProjets } from './projets.mjs';

/** Les îles du jeu (src/game/islands.ts). */
function ilesDuJeu() {
  const texte = readFileSync('src/game/islands.ts', 'utf8');
  return JSON.parse(texte.slice(texte.indexOf('= [') + 2, texte.lastIndexOf(' satisfies')));
}
const ILES = ilesDuJeu();
const MONUMENTS = new Map([['landmark-5e-1', '5e']]);
const BANQUES = ['compound-5e', 'project-5e-counter'];

const ENTETE = ['## Les pièces', '', '| projet | pièce | recette 1 | questions 1 | recette 2 | questions 2 | Blocland | Archipéo |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
const piece = (id, r1, r2) => `| \`landmark-5e-1\` | \`${id}\` | ${r1} | \`compound-5e\` | ${r2} | \`project-5e-counter\` | le ${id} | le ${id} |`;
const BONNE_1 = 'maths-5e-signed-numbers × 6 · french-5e-homophones × 4';
const BONNE_2 = 'english-5e-grammar × 6 · geography-5e-resources × 4';
const verifier = (...lignes) => () => verifierProjets(lireProjets([...ENTETE, ...lignes, ''].join('\n'), 'projets.md'), ILES, MONUMENTS, BANQUES, 'projets.md');
const trois = (r1 = BONNE_1, r2 = BONNE_2) => [piece('a', r1, r2), piece('b', BONNE_1, BONNE_2), piece('c', BONNE_1, BONNE_2)];

describe('docs/contenu/projets.md', () => {
  it('le fichier du dépôt se lit et se vérifie : le phare du large en cinq pièces', () => {
    const md = readFileSync(`docs/contenu/${FICHIER_PROJETS}`, 'utf8');
    const banques = lireBanques(md, FICHIER_PROJETS);
    expect(banques.map((b) => b.bloc).sort()).toEqual(['project-5e-chronicle', 'project-5e-counter', 'project-5e-travellers']);
    const [phare] = verifierProjets(lireProjets(md, FICHIER_PROJETS), ILES, MONUMENTS, ['compound-5e', ...banques.map((b) => b.bloc)], FICHIER_PROJETS);
    expect(phare.pieces.map((p) => p.id)).toEqual(['base', 'tower', 'gallery', 'lantern', 'roof']);
  });

  it('une pièce bien écrite passe', () => {
    expect(verifier(...trois())()[0].pieces[0]).toEqual({
      id: 'a',
      recipes: [
        { ingredients: [{ bloc: 'maths-5e-signed-numbers', n: 6 }, { bloc: 'french-5e-homophones', n: 4 }], bank: 'compound-5e' },
        { ingredients: [{ bloc: 'english-5e-grammar', n: 6 }, { bloc: 'geography-5e-resources', n: 4 }], bank: 'project-5e-counter' },
      ],
      names: { blocland: 'le a', archipeo: 'le a' },
    });
  });

  it('refuse trop peu de pièces, une banque inconnue, une île d’une autre classe, deux îles de la même matière', () => {
    expect(verifier(piece('a', BONNE_1, BONNE_2))).toThrow(/trois à six pièces/);
    expect(verifier(...trois(), piece('d', BONNE_1, BONNE_2).replace('compound-5e', 'compound-6e'))).toThrow(/banque de questions « compound-6e » inconnue/);
    expect(verifier(...trois('maths-6e-calculation × 6 · french-5e-homophones × 4'))).toThrow(/île de 6e, pas de 5e/);
    expect(verifier(...trois('maths-5e-signed-numbers × 6 · maths-5e-proportionality × 4'))).toThrow(/matières différentes/);
  });

  it('refuse deux recettes qui partagent une matière', () => {
    expect(verifier(...trois(BONNE_1, 'maths-5e-proportionality × 6 · english-5e-grammar × 4'))).toThrow(/aucune matière en commun/);
  });

  it('refuse une banque qui ne s’appelle pas « project-… »', () => {
    expect(() => lireBanques('## Les questions\n\n### Le vitrail · `compound-5e`\n', 'projets.md')).toThrow(/project-…/);
  });
});
