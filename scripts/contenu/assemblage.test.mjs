import { readFileSync } from 'node:fs';
import { lireAssemblage } from './assemblage.mjs';

const md = readFileSync('docs/contenu/assemblage.md', 'utf8');
const lire = (m) => () => lireAssemblage(m, 'assemblage.md');

describe('l’assemblage des blocs en Markdown', () => {
  it('lit le lieu et les recettes, avec les noms de chaque univers', () => {
    const a = lireAssemblage(md, 'assemblage.md');
    expect(a.lieu.blocland.titre).toBe('La Fabrique');
    expect(a.lieu.archipeo.titre).toBe('La Halle aux matériaux');
    expect(a.recettes[1]).toEqual({
      bloc: 'vitrail',
      archipelago: '5e',
      ingredients: [
        { bloc: 'glace', n: 2 },
        { bloc: 'panneau', n: 1 },
      ],
      noms: { blocland: { nom: 'Vitrail', pluriel: 'vitraux' }, archipeo: { nom: 'Hublot' } },
    });
  });

  it('refuse une recette mal écrite, un archipel en double ou un univers sans nom', () => {
    expect(lire(md.replace('bois × 2', 'bois x 2'))).toThrow(/bloc × nombre/);
    expect(lire(md.replace('| `vitrail` | 5e', '| `vitrail` | 6e'))).toThrow(/déjà son bloc assemblé/);
    expect(lire(md.replace(/^\| `archipeo` .*$/m, ''))).toThrow(/ligne de tableau attendue|univers « archipeo »/);
    expect(lire(md.replace('## Le lieu', '## Lieu'))).toThrow(/« ## Le lieu » manque/);
  });
});
