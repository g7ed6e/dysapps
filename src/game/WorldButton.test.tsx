import { act, fireEvent, render, screen } from '@testing-library/react';
import { WorldButton } from './WorldButton';

afterEach(() => vi.useRealTimers());

it('le doigt posé une demi-seconde montre le nom du bouton, sans rien ouvrir en se levant', () => {
  vi.useFakeTimers();
  const ouvrir = vi.fn();
  render(<WorldButton icon="school" name="École du village" onClick={ouvrir} />);
  const bouton = screen.getByRole('button', { name: 'École du village' });
  fireEvent.pointerDown(bouton);
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByRole('status')).toHaveTextContent('École du village');
  fireEvent.pointerUp(bouton);
  fireEvent.click(bouton);
  expect(ouvrir).not.toHaveBeenCalled();
  // Un toucher court ouvre ; l'étiquette s'efface d'elle-même.
  fireEvent.pointerDown(bouton);
  fireEvent.pointerUp(bouton);
  fireEvent.click(bouton);
  expect(ouvrir).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('un bouton vide reste à sa place, délavé : son toucher dit pourquoi au lieu d’agir', () => {
  const reprendre = vi.fn();
  render(<WorldButton icon="play" name="Ma dernière mission" empty="pas encore de mission" onClick={reprendre} />);
  const bouton = screen.getByRole('button', { name: 'Ma dernière mission : pas encore de mission' });
  expect(bouton).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(bouton);
  expect(reprendre).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('pas encore de mission');
});

it('au survol de la souris, le nom s’affiche, et s’efface quand elle part', () => {
  render(<WorldButton icon="trophy" name="Salle des trophées" onClick={() => {}} />);
  const bouton = screen.getByRole('button', { name: 'Salle des trophées' });
  fireEvent.pointerEnter(bouton, { pointerType: 'mouse' });
  expect(screen.getByRole('status')).toHaveTextContent('Salle des trophées');
  fireEvent.pointerLeave(bouton, { pointerType: 'mouse' });
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});
