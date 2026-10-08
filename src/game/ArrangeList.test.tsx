// Le mode « Aménager » en vue simple (GD-9, point 4) : une ligne par lieu (son Gardien le suit, GD-11), sa place en
// signes (dite en mots aux lecteurs d'écran) ; « Déplacer », les flèches et « Poser » ; l'ordre des lignes ne dépend pas de la disposition.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { ArrangeList } from './ArrangeList';
import { BloclandProvider } from './BloclandContext';
import { applyLayout } from './world/appliedLayout';
import { islandsOf } from './world/archipelago';
import { freeSpots, isFixedPlace, spotOf } from './world/arrange';
import type { BiomeId } from './biomes';
import { EMPTY_STATE } from './engine/state';
import { toutConstruit } from './world/budget';

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

/** Les lignes de premier niveau (un lieu), sans celles des plis. */
const lignes = () =>
  Array.from(screen.getAllByRole('list')[0].children)
    .filter((li) => li.tagName === 'LI')
    .map((li) => li.querySelector('strong, .signe-voisin')!.textContent);

afterEach(() => {
  cleanup();
  applyLayout(undefined);
  localStorage.clear();
});

/**
 * Les flèches, un cran à la fois (choix 3 du mainteneur : une place prise se montre, « Poser » éteint), dans la
 * première direction qui mène à une autre place libre, où « Poser » s'allume.
 */
function jusquAUnePlaceLibre(): void {
  const depart = screen.getByRole('status').textContent;
  for (const nom of ['Est', 'Ouest', 'Nord', 'Sud']) {
    for (let i = 0; i < 20; i++) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
      const t = screen.getByRole('status').textContent;
      if (/Plus de place/.test(t ?? '')) break;
      if (t !== depart && screen.getByRole('button', { name: 'Poser' }).matches(':enabled')) return;
    }
  }
}

/** Un lieu mené, cran par cran, à sa place libre la plus proche (en passant par des places prises). */
function jusquALaPlaceLibreDuLieu(id: BiomeId): void {
  const w = { ...EMPTY_STATE.world };
  const s = spotOf(w, id);
  const t = freeSpots(w, id)
    .filter((q) => q.x !== s.x || q.y !== s.y)
    .sort((p, q) => Math.abs(p.x - s.x) + Math.abs(p.y - s.y) - Math.abs(q.x - s.x) - Math.abs(q.y - s.y))[0];
  // L'est est vers les x qui descendent, le nord vers les y qui montent.
  const pas = (n: number, plus: string, moins: string) => {
    for (let i = 0; i < Math.abs(n); i++) fireEvent.click(screen.getByRole('button', { name: new RegExp(n > 0 ? plus : moins) }));
  };
  pas(t.x - s.x, 'Ouest', 'Est');
  pas(t.y - s.y, 'Nord', 'Sud');
}

describe('Aménager en vue simple', () => {
  it('une ligne par lieu, aucune pour son Gardien (GD-11), sa place en signes ; « Déplacer », une flèche, « Poser » ; l’ordre ne bouge pas', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const lieux = islandsOf('6e');
    const avant = lignes();
    // Le Gardien suit son île (GD-11) : pas de ligne à lui.
    expect(avant).toEqual(lieux.map((b) => b.name));
    expect(screen.queryByRole('button', { name: /Déplacer le Gardien/ })).toBeNull();
    // Pas de phrase d'introduction : les lignes suffisent.
    expect(document.querySelector('.section-intro')).toBeNull();
    // La place en signes (le voisin, la flèche, le nombre, la case), dite en mots ; le point de départ : un drapeau et un
    // cadenas.
    for (const b of lieux) {
      const p = screen.getByText(b.name, { selector: 'strong' }).closest('p')!;
      expect(p.querySelector('.visually-hidden')!.textContent).toMatch(isFixedPlace(b.id) ? /ne bouge pas/ : / à \d+ cases?\.$/);
      if (!isFixedPlace(b.id)) expect(p.querySelector('.signes-de-place')).not.toBeNull();
    }
    const mobile = lieux.find((b) => !isFixedPlace(b.id))!;
    fireEvent.click(screen.getByRole('button', { name: `Déplacer ${mobile.name}` }));
    expect(screen.getByRole('button', { name: `Déplacer ${mobile.name}` })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Poser' }).className).toMatch(/primary/);
    const depart = spotOf({ ...EMPTY_STATE.world }, mobile.id);
    // Les flèches, un cran à la fois (les places prises se montrent, « Poser » éteint), jusqu'à une place libre ; puis
    // « Poser ici ».
    jusquALaPlaceLibreDuLieu(mobile.id);
    expect(screen.getByRole('button', { name: 'Poser' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(screen.getByRole('status')).toHaveTextContent(/ à \d+ cases?\.$/);
    const monde = JSON.parse(localStorage.getItem('dysapps:game')!).world;
    expect(spotOf(monde, mobile.id)).not.toEqual(depart);
    // La disposition a changé, l'ordre des lignes non.
    expect(lignes()).toEqual(avant);
  });

  it('les bornes et les arrivées d’un lieu, dans son pli, se déplacent de même', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const boutons = screen.getAllByRole('button', { name: /^Déplacer (la borne|l’arrivée)/ });
    expect(boutons.length).toBeGreaterThan(0);
    const borne = screen.getAllByRole('button', { name: /^Déplacer la borne/ })[0];
    const li = borne.closest('li')!;
    const avant = li.querySelector('p')!.textContent;
    fireEvent.click(borne);
    expect(borne).toHaveAttribute('aria-pressed', 'true');
    jusquAUnePlaceLibre();
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(li.querySelector('p')!.textContent).not.toBe(avant);
  });

  it('« Réunir » sur la ligne d’un lieu qui a un voisin ouvert au plus près : la paire est réunie et sauvegardée', () => {
    localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: toutConstruit().world.links } }));
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const reunir = screen.queryAllByRole('button', { name: /^Réunir / });
    // Sur la carte de départ, la Tour et la Ferme (leur isthme d'avant) sont déjà au plus près.
    expect(reunir.length).toBeGreaterThan(0);
    fireEvent.click(reunir[0]);
    // La question d'abord, sous la ligne du lieu : « Réunir » (ou un bouton par voisin), et la croix « Ne pas réunir » ; la
    // digue expliquée la première fois (en attente du choix du mainteneur).
    const question = screen.getByRole('group', { name: /^Réunir .* \?$/ });
    expect(question).toHaveTextContent(/Les deux lieux ne se sépareront plus\./);
    expect(question).toHaveTextContent(/Une digue de cubes d’herbe sur la pierre/);
    expect(within(question).getByRole('button', { name: /Ne pas réunir/ })).toBeInTheDocument();
    expect(localStorage.getItem('dysapps:game')).not.toMatch(/joined/);
    fireEvent.click(within(question).getAllByRole('button', { name: /^Réunir avec (la |le |l’)/ })[0]);
    expect(screen.getByRole('status')).toHaveTextContent(/^(La .+ est réunie|Le .+ est réuni|L’.+ est réunie?) (à la|au|à l’) .+\./);
    const layout = JSON.parse(localStorage.getItem('dysapps:game')!).world.layout as Record<string, { joined?: string }>;
    expect(Object.values(layout).some((l) => l.joined)).toBe(true);
    expect(screen.getAllByText(/\. Réunie? (à la|au|à l’) .+\.$/).length).toBe(2);
  });
});
