import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Completion } from '../../engine';
import { SettingsProvider } from '../../../core/SettingsContext';
import { WorldDone } from './WorldDone';

const completion = {
  stars: 3,
  perfect: true,
  blocks: 8,
  block: 'french-6e-phonology',
  xp: 18,
  streak: { extended: true, streak: { current: 2 } },
} as unknown as Completion;

describe('Le bilan d’un lieu du monde ouvert', () => {
  it('les étoiles, une rangée de pastilles sans phrases, le détail sur demande, un seul bouton « Continuer »', async () => {
    const user = userEvent.setup();
    const back = vi.fn();
    render(<WorldDone completion={completion} detail={<p>Le détail de l’écran classique</p>} pause={null} back={{ label: 'Revenir au Phare', onClick: back }} />);
    expect(screen.getByRole('heading', { name: 'Sans faute !' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 étoiles sur 3' })).toBeInTheDocument();
    const pills = screen.getAllByRole('listitem');
    expect(pills.map((li) => li.textContent)).toEqual(['+8', '+18', '2']);
    expect(pills[0]).toHaveAccessibleName('8 blocs de bois');
    expect(screen.queryByText('Le détail de l’écran classique')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Détail/ }));
    expect(screen.getByText('Le détail de l’écran classique')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /Continuer/ }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('la pause de session prend la place de « Continuer »', () => {
    render(<WorldDone completion={completion} detail={null} pause={<p>Pause</p>} back={{ label: 'Revenir', onClick: () => {} }} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continuer/ })).not.toBeInTheDocument();
  });

  it('la suite de la mission (GD-27) s’écrit après le résultat, avec sa voix, et le détail reste sur demande', () => {
    render(
      <SettingsProvider>
        <WorldDone completion={completion} detail={<p>Le détail de l’écran classique</p>} pause={null} back={{ label: 'Revenir', onClick: () => {} }} follow="Les rangées sont comptées." />
      </SettingsProvider>,
    );
    const follow = screen.getByText((_, el) => el?.classList.contains('world-done-follow') === true);
    expect(follow).toHaveTextContent('Les rangées sont comptées.');
    expect(screen.queryByText('Le détail de l’écran classique')).not.toBeInTheDocument();
  });
});
