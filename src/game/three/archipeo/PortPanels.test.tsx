// Les panneaux de l'Escale (GD-20, lot 2) : la fiche du Port et ses cinq « Y aller », une porte et ses missions qui
// ramènent au monde, Échap qui ferme, l'adresse de retour lue sans rien inventer.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Celebrations } from '../../../components/Celebrations';
import { ProgressProvider, useProgress } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { PortPanels, portFromParam, portResume, portReturn, type PortPanel } from './PortPanels';

const NAMES = { nom: 'L’Escale', ecole: 'La Maison des Savoirs', succes: 'La Galerie des Merveilles', assemblage: 'L’Entrepôt des matériaux' };

function renderPanel(panel: PortPanel, onGo = vi.fn(), onClose = vi.fn(), onNef?: () => void) {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <PortPanels panel={panel} names={NAMES} onGo={onGo} onNef={onNef} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  return { onGo, onClose };
}

it('la fiche du Port a cinq lignes, chacune avec « Y aller », qui mènent à leur endroit', async () => {
  const user = userEvent.setup();
  const { onGo } = renderPanel('fiche');
  const sheet = screen.getByRole('dialog', { name: 'L’Escale' });
  const go = within(sheet).getAllByRole('button', { name: /^Y aller/ });
  expect(go).toHaveLength(5);
  expect(go.map((b) => b.getAttribute('aria-label'))).toEqual(['Y aller : Français', 'Y aller : Maths', 'Y aller : Anglais', 'Y aller : Succès', 'Y aller : Assembler']);
  await user.click(go[4]);
  expect(onGo).toHaveBeenCalledWith('chantier');
});

it('la Nef pas encore partie : une sixième ligne qui ouvre sa fiche (GD-21)', async () => {
  const user = userEvent.setup();
  const onNef = vi.fn();
  renderPanel('fiche', vi.fn(), vi.fn(), onNef);
  const sheet = screen.getByRole('dialog', { name: 'L’Escale' });
  await user.click(within(sheet).getByRole('button', { name: 'Y aller : La Nef' }));
  expect(onNef).toHaveBeenCalled();
});

it('une porte montre ses missions, sans sous-titre (la façade se voit à côté) ; aucun lien ne sort du monde', () => {
  renderPanel('maths');
  const sheet = screen.getByRole('dialog', { name: 'Maths' });
  expect(sheet.textContent).not.toContain('La Maison des Savoirs');
  expect(sheet.querySelector('.island-sheet-module')).toBeNull();
  const links = within(sheet).getAllByRole('link');
  expect(links.length).toBeGreaterThan(1);
  for (const a of links) expect(a.getAttribute('href')).toMatch(/^\/app\//);
  expect(sheet.textContent).not.toMatch(/Les îles de/);
});

it('Échap ferme le panneau, comme la croix', async () => {
  const user = userEvent.setup();
  const { onClose } = renderPanel('succes');
  expect(screen.getByRole('dialog', { name: 'La Galerie des Merveilles' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});

it('l’adresse de retour se lit sans rien inventer', () => {
  expect(portReturn('english')).toBe('/adventure?porte=english');
  expect(portFromParam('english')).toBe('english');
  expect(portFromParam('chantier')).toBe('chantier');
  expect(portFromParam('quai')).toBeNull();
  expect(portFromParam('ailleurs')).toBeNull();
  expect(portFromParam(null)).toBeNull();
  // « Ma dernière mission » : une mission de l'école ramène à sa porte, une autre garde son retour.
  expect(portResume('/app/tables')).toBe('/adventure?porte=maths');
  expect(portResume('/app/homophones')).toBe('/adventure?porte=french');
  expect(portResume('/adventure/french-6e-phonology/x')).toBeUndefined();
});

/** Finit un plan d'un coup : le niveau monte, une célébration arrive. */
function Gain() {
  const { completePlan } = useProgress();
  return (
    <button type="button" onClick={() => completePlan(230)}>
      Gagner
    </button>
  );
}

it('un panneau ouvert retient les célébrations ; fermé, elles reviennent', () => {
  const view = (open: boolean) => (
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <Celebrations />
            <Gain />
            {open && <PortPanels panel="fiche" names={NAMES} onGo={vi.fn()} onClose={vi.fn()} />}
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
  const { rerender } = render(view(true));
  act(() => screen.getByRole('button', { name: 'Gagner' }).click());
  expect(document.querySelector('.celebration')).toBeNull();
  rerender(view(false));
  expect(document.querySelector('.celebration')).not.toBeNull();
});
