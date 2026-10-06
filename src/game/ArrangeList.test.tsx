// Le mode « Aménager » en vue simple (GD-9, point 4) : une ligne par lieu et par Gardien, sa place en signes (dite en
// mots aux lecteurs d'écran) ; « Déplacer », les flèches et « Poser » ; l'ordre des lignes ne dépend pas de la disposition.
import { ofPlace } from './world/placeSentence';
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

/** Les lignes de premier niveau (un lieu, un Gardien), sans celles des plis. */
const lignes = () =>
  Array.from(screen.getAllByRole('list')[0].children)
    .filter((li) => li.tagName === 'LI')
    .map((li) => li.querySelector('strong')!.textContent);

afterEach(() => {
  cleanup();
  applyLayout(undefined);
  localStorage.clear();
});

describe('Aménager en vue simple', () => {
  it('une ligne par lieu et par Gardien, sa place en signes ; « Déplacer », une flèche, « Poser » ; l’ordre ne bouge pas', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const lieux = islandsOf('6e');
    const avant = lignes();
    expect(avant).toHaveLength(lieux.length * 2);
    expect(avant[0]).toBe(lieux[0].name);
    // Le Gardien : le bouclier et le nom de son lieu.
    expect(avant[1]).toBe(lieux[0].name);
    // Pas de phrase d'introduction : les lignes suffisent.
    expect(document.querySelector('.section-intro')).toBeNull();
    // La place en signes (le voisin, la flèche, le nombre, la case), dite en mots ; le point de départ : un drapeau et un
    // cadenas.
    for (const b of lieux) {
      // La première ligne à son nom est celle du lieu (celle de son Gardien suit).
      const p = screen.getAllByText(b.name, { selector: 'strong' })[0].closest('p')!;
      expect(p.querySelector('.visually-hidden')!.textContent).toMatch(isFixedPlace(b.id) ? /ne bouge pas/ : / à \d+ cases?\.$/);
      if (!isFixedPlace(b.id)) expect(p.querySelector('.signes-de-place')).not.toBeNull();
    }
    const mobile = lieux.find((b) => !isFixedPlace(b.id))!;
    fireEvent.click(screen.getByRole('button', { name: `Déplacer ${mobile.name}` }));
    expect(screen.getByRole('button', { name: `Déplacer ${mobile.name}` })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Poser' }).className).toMatch(/primary/);
    const depart = spotOf({ ...EMPTY_STATE.world }, mobile.id);
    // Une flèche qui trouve une place (la première des quatre qui en a une), puis « Poser ici ».
    for (const nom of ['Est', 'Ouest', 'Nord', 'Sud']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
      if (!screen.getByRole('status').textContent?.includes('Plus de place')) break;
    }
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(screen.getByRole('status')).toHaveTextContent(/ à \d+ cases?\.$/);
    const monde = JSON.parse(localStorage.getItem('dysapps:game')!).world;
    expect(spotOf(monde, mobile.id)).not.toEqual(depart);
    // La disposition a changé, l'ordre des lignes non.
    expect(lignes()).toEqual(avant);
  });

  it('le Gardien se déplace autour de son île', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const b = islandsOf('6e')[0];
    const li = screen.getByRole('button', { name: `Déplacer le Gardien ${ofPlace(b.name)}` }).closest('li')!;
    const avant = li.querySelector('p .visually-hidden')!.textContent;
    expect(avant).toMatch(/de son île\.$/);
    fireEvent.click(within(li).getByRole('button', { name: `Déplacer le Gardien ${ofPlace(b.name)}` }));
    // Les flèches le mènent jusqu'à un autre côté de son île (quelques pas le long du même côté d'abord).
    const cote = (t: string | null | undefined) => /: (.*) de son île/.exec(t ?? '')?.[1];
    const depart = cote(avant);
    tour: for (const nom of ['Est', 'Ouest', 'Nord']) {
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
        const t = screen.getByRole('status').textContent;
        if (t?.includes('Plus de place')) break;
        if (cote(t) && cote(t) !== depart) break tour;
      }
    }
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(cote(li.querySelector('p .visually-hidden')!.textContent)).not.toBe(depart);
  });
  it('les bornes et les arrivées d’un lieu, dans son pli, se déplacent de même', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const boutons = screen.getAllByRole('button', { name: /^Déplacer (la borne|l’arrivée)/ });
    expect(boutons.length).toBeGreaterThan(0);
    const borne = screen.getAllByRole('button', { name: /^Déplacer la borne/ })[0];
    const li = borne.closest('li')!;
    const avant = li.querySelector('p')!.textContent;
    fireEvent.click(borne);
    expect(borne).toHaveAttribute('aria-pressed', 'true');
    for (const nom of ['Est', 'Ouest', 'Nord', 'Sud']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(nom) }));
      if (!/Plus de place|ne peut/.test(screen.getByRole('status').textContent ?? '')) break;
    }
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(li.querySelector('p')!.textContent).not.toBe(avant);
  });

  it('« Réunir » sur la ligne d’un lieu qui a un voisin ouvert au plus près : la paire est réunie et sauvegardée', () => {
    localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: toutConstruit().world.links } }));
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
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
