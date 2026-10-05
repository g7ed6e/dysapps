// L'habillage (J6, U4) : le rendu choisi donne celui de son univers, et le dessin de chaque univers est figé ici tant
// que les captures ne sont pas comparées en CI. Une ligne ajoutée à `Habillage` s'ajoute aux deux tables ci-dessous.
import { habillageDe, HABILLAGES } from './skin';

describe('L’habillage du monde', () => {
  it('le rendu en blocs est habillé en Blocland, le rendu d’Archipéo en Archipéo', () => {
    expect(habillageDe('blocs')).toBe(HABILLAGES.blocland);
    expect(habillageDe('archipeo')).toBe(HABILLAGES.archipeo);
  });

  it('Blocland garde son dessin : le monde en blocs, les figures en cubes, l’arène', () => {
    expect(HABILLAGES.blocland).toEqual({
      univers: 'blocland',
      ciel: 'palette',
      brume: 'voiles',
      large: 'blocs',
      sol: 'cubes',
      personnages: 'cubes',
      etiquettes: 'voilees',
      figures: 'cubes',
      reperes: 'libres',
      atelier: 'fabrique',
      pose: 'geste',
      formeDesSignes: 'plaque',
      blocDesIles: 'avant-le-nom',
    });
  });

  it('Archipéo garde son dessin : le ciel en dégradé, le sol à facettes, les modèles dessinés, les sentinelles', () => {
    expect(HABILLAGES.archipeo).toEqual({
      univers: 'archipeo',
      ciel: 'degrade',
      brume: 'bancs',
      large: 'mer-et-faune',
      sol: 'facettes',
      personnages: 'modeles',
      etiquettes: 'nettes',
      figures: 'modeles',
      reperes: 'cadres',
      atelier: 'halle',
      pose: 'fondu',
      formeDesSignes: 'hexagone',
      blocDesIles: 'avant-le-nom',
    });
  });
});
