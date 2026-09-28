import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatDuree, formatHeure, formatNombre, Scene } from './Scene';

describe('Scene', () => {
  it('écrit les heures et les durées comme à l’école', () => {
    expect(formatHeure(580)).toBe('9 h 40');
    expect(formatHeure(605)).toBe('10 h 05');
    expect(formatDuree(35)).toBe('35 min');
    expect(formatDuree(75)).toBe('1 h 15 min');
    expect(formatDuree(60)).toBe('1 h');
  });

  it('dit le pont et marque la travée cherchée', () => {
    const { container } = render(<Scene scene="pont" unit="m" parts={[48, '?']} total={85} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Un pont entre deux falaises, en 2 travées : 48 mètres, inconnu. Écart total : 85 mètres.');
    expect(container.querySelectorAll('.ask')).toHaveLength(1);
  });

  it('dit le quai, son entrée et son tour', () => {
    render(<Scene scene="quai" unit="m" longueur={30} largeur={12} entree={4} perimetre="?" ask="perimetre" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Un quai rectangulaire vu du dessus : longueur 30 mètres, largeur 12 mètres, une entrée de 4 mètres sans clôture. Tour du quai : inconnu.',
    );
    expect(screen.getByText('entrée 4 m')).toBeInTheDocument();
  });

  it('dit la traversée avec les heures en toutes lettres', () => {
    render(<Scene scene="traversee" depart={580} arrivee="?" duree={35} />);
    expect(screen.getByRole('img')).toHaveAccessibleName("Une traversée en bateau d’une île à l’autre. Départ : 9 h 40. Durée : 35 min. Arrivée : inconnue.");
    expect(screen.getByText('durée : 35 min')).toBeInTheDocument();
  });

  it('écrit les nombres à la française', () => {
    expect(formatNombre(50000)).toBe('50\u00a0000');
    expect(formatNombre(2250)).toBe('2\u00a0250');
    expect(formatNombre(850)).toBe('850');
    expect(formatNombre(1.5)).toBe('1,5');
  });

  it('dit la carte et son échelle', () => {
    render(<Scene scene="carte" echelle={{ fraction: 50000 }} carte={4} reel="?" unitReel="km" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Une carte avec deux îles. Échelle : 1 sur 50\u00a0000. Sur la carte, entre les deux îles : 4 centimètres. En vrai : inconnu.');
    expect(screen.getByText('1/50 000')).toBeInTheDocument();
  });

  it('dit la cargaison et son ratio sans deux-points', () => {
    const { container } = render(<Scene scene="cargaison" unit="caisses" ratio={[2, 3]} total={40} parts={['?', 24]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Une cargaison de 40 caisses partagée entre 2 navires dans le ratio 2 pour 3. Navire A, 2 parts : inconnu. Navire B, 3 parts : 24 caisses.',
    );
    expect(container.querySelectorAll('.crate')).toHaveLength(5);
  });

  it('n’écrit pas une quantité ni donnée ni cherchée (null)', () => {
    const { container } = render(<Scene scene="cargaison" unit="kg" ratio={[2, 3]} total={null} parts={[16, '?']} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Une cargaison partagée entre 2 navires dans le ratio 2 pour 3. Navire A, 2 parts : 16 kilos. Navire B, 3 parts : inconnu.',
    );
    expect(container.textContent).not.toContain('en tout');
  });

  it('dit le mât et son câble', () => {
    render(<Scene scene="mat" unit="m" hauteur={8} pied={6} cable="?" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      "Un mât vertical tenu par un câble tendu jusqu’au sol, un triangle rectangle au pied du mât. Hauteur du mât : 8 mètres. Du pied du mât au câble, au sol : 6 mètres. Longueur du câble : inconnu.",
    );
  });
});
