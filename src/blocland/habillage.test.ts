// L'habillage (J6, U4) : chaque univers a le sien, et le rendu choisi donne celui de son univers.
import { habillageDe, HABILLAGES } from './habillage';
import { UNIVERS_IDS } from '../core/univers';

describe('L’habillage du monde', () => {
  it('chaque univers a son habillage, à son nom', () => {
    for (const u of UNIVERS_IDS) expect(HABILLAGES[u].univers).toBe(u);
  });

  it('le rendu en blocs est habillé en Blocland, le rendu d’Archipéo en Archipéo', () => {
    expect(habillageDe('blocs')).toBe(HABILLAGES.blocland);
    expect(habillageDe('archipeo')).toBe(HABILLAGES.archipeo);
  });

  it('Blocland garde tout le dessin d’avant (le monde en blocs, en pixels, en cubes, l’arène)', () => {
    expect(HABILLAGES.blocland).toEqual({
      univers: 'blocland',
      ciel: 'palette',
      brume: 'nappes',
      large: 'blocs',
      sol: 'cubes',
      personnages: 'cubes',
      etiquettesDansLaBrume: true,
      dessin2D: 'pixels',
      figures: 'cubes',
      sentinelles: false,
    });
  });
});
