// Le mode « Aménager » en vue simple (GD-9, point 4) : une ligne par lieu et par Gardien, sa place en mots ;
// « Déplacer », les flèches et « Poser ici » ; l'ordre des lignes ne dépend pas de la disposition.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { ArrangeList } from './ArrangeList';
import { BloclandProvider } from './BloclandContext';
import { applyLayout } from './world/appliedLayout';
import { islandsOf } from './world/archipelago';
import { isFixedPlace, spotOf } from './world/arrange';
import { EMPTY_STATE } from './engine/state';

function monter() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <ArrangeList a="6e" />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const lignes = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('strong')!.textContent);

afterEach(() => {
  cleanup();
  applyLayout(undefined);
  localStorage.clear();
});

describe('Aménager en vue simple', () => {
  it('une ligne par lieu et par Gardien, sa place en mots ; « Déplacer », une flèche, « Poser ici » ; l’ordre ne bouge pas', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const lieux = islandsOf('6e');
    const avant = lignes();
    expect(avant).toHaveLength(lieux.length * 2);
    expect(avant[0]).toBe(lieux[0].name);
    expect(avant[1]).toBe(`Le Gardien de ${lieux[0].name}`);
    // La place dite en mots : une direction et une distance, ou le point de départ qui ne bouge pas.
    for (const b of lieux) {
      const p = screen.getByText(b.name, { selector: 'strong' }).closest('p')!;
      expect(p.textContent).toMatch(isFixedPlace(b.id) ? /ne bouge pas/ : / à \d+ cases?\.$/);
    }
    const mobile = lieux.find((b) => !isFixedPlace(b.id))!;
    fireEvent.click(screen.getByRole('button', { name: `Déplacer ${mobile.name}` }));
    expect(screen.getByRole('button', { name: `Déplacer ${mobile.name}` })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Poser ici/ }).className).toMatch(/primary/);
    const depart = spotOf({ ...EMPTY_STATE.world }, mobile.id);
    // Une flèche qui trouve une place (la première des quatre qui en a une), puis « Poser ici ».
    for (const nom of ['Est', 'Ouest', 'Nord', 'Sud']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
      if (!screen.getByRole('status').textContent?.includes('Plus de place')) break;
    }
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/^C’est posé\./);
    const monde = JSON.parse(localStorage.getItem('dysapps:game')!).world;
    expect(spotOf(monde, mobile.id)).not.toEqual(depart);
    // La disposition a changé, l'ordre des lignes non.
    expect(lignes()).toEqual(avant);
  });

  it('le Gardien se déplace autour de son île', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const b = islandsOf('6e')[0];
    const li = screen.getByText(`Le Gardien de ${b.name}`, { selector: 'strong' }).closest('li')!;
    const avant = li.querySelector('p')!.textContent;
    expect(avant).toMatch(/de son île\.$/);
    fireEvent.click(within(li).getByRole('button', { name: `Déplacer le Gardien de ${b.name}` }));
    for (const nom of ['Est', 'Ouest', 'Nord', 'Sud']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
      if (!screen.getByRole('status').textContent?.includes('Plus de place')) break;
    }
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    expect(screen.getByText(`Le Gardien de ${b.name}`, { selector: 'strong' }).closest('p')!.textContent).not.toBe(avant);
  });
});
