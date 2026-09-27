import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatDuree, formatHeure, Scene } from './Scene';

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
    expect(screen.getByRole('img')).toHaveAccessibleName("Une traversée en bateau d'une île à l'autre. Départ : 9 h 40. Durée : 35 min. Arrivée : inconnue.");
    expect(screen.getByText('durée : 35 min')).toBeInTheDocument();
  });
});
