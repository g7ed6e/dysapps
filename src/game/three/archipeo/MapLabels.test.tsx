// Les étiquettes de la Carte (GD-20, point 3, « vraies terres, vrais ponts ») : un cadenas par pont à rebâtir, plein pour
// le pont suggéré seul ; les lieux des terres fermées en pastilles pâles, touchables, qui ouvrent la fiche de leur terre.
// Depuis la piste B (« Noms plafonnés, sans trait », 24 octobre 2026), la même Carte aux quatre niveaux.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { bridgeSpot, landById, type LinkedLand, linkedLands, placesOfLands } from '../../world/continu/lands';
import { PLACES, type PlaceId } from '../../world/continu/plan6e';
import { MapLabels } from './MapLabels';
import type { MapSpotOnScreen } from './scene';
import { planFor } from '../../world/continu/levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LINKED_LANDS = linkedLands(PLAN);

// Pas de ResizeObserver sous jsdom : les étiquettes ne relisent leurs tailles qu'avec lui.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const states = Object.fromEntries(PLACES.map((p) => [p.id, null])) as Record<PlaceId, null>;
const words = { 'a-explorer': 'À explorer', 'en-chantier': 'En chantier', restauree: 'Restaurée' } as never;

function renderMap(suggested: LinkedLand | null, onClosed = vi.fn()) {
  const { container } = render(
    <MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={onClosed} suggested={suggested} states={states} words={words} />,
  );
  const locks = [...container.querySelectorAll<HTMLElement>('.open-world-map-closed')].map((b) => ({ id: b.dataset.lieu, full: b.querySelector('.open-world-lock')!.classList.contains('suggested'), el: b }));
  const pale = [...container.querySelectorAll<HTMLElement>('.open-world-map-pale')];
  return { locks, pale, onClosed };
}

test('un cadenas par pont ; celui du pont suggéré, et lui seul, est plein', () => {
  const { locks } = renderMap('levant');
  expect(locks.map((l) => l.id)).toEqual(['pont-couchant', 'pont-large', 'pont-levant', 'pont-cretes']);
  expect(locks.filter((l) => l.full).map((l) => l.id)).toEqual(['pont-levant']);
  expect(locks[0].el.getAttribute('aria-label')).toBe('Le Couchant : fermé, le pont du Couchant est à rebâtir.');
  // La voix dit le suggéré, que le cadenas plein montre.
  expect(locks[2].el.getAttribute('aria-label')).toBe('Le Levant : fermé, le pont du Levant est à rebâtir. Suggéré.');
});

test('sans pont suggéré, aucun cadenas plein', () => {
  expect(renderMap(null).locks.some((l) => l.full)).toBe(false);
});

test('les lieux des terres fermées : des pastilles pâles d’icône, sans nom écrit ni cadenas, qui ouvrent la fiche de leur terre (piste B)', () => {
  const { pale, onClosed } = renderMap(null);
  expect(pale).toHaveLength(12);
  expect(pale.every((b) => !b.querySelector('.open-world-lock'))).toBe(true);
  // Leur icône seule : le nom n'est plus écrit, la voix le dit.
  expect(pale.every((b) => !b.querySelector('.open-world-map-place-name') && b.querySelector('.open-world-map-icon svg'))).toBe(true);
  const ruins = pale.find((b) => b.dataset.lieu === 'ruins')!;
  expect(ruins).not.toHaveTextContent('Les Ruines');
  expect(ruins.getAttribute('aria-label')).toMatch(/^Les Ruines, /);
  fireEvent.click(ruins);
  expect(onClosed).toHaveBeenCalledWith('couchant');
});

test('au 5e (GD-22) : un triangle « en haut » collé au nom de chaque lieu ouvert du plateau, sur l’icône d’un lieu pâle, et dit ; sur « Toi » quand Kéo y monte', () => {
  const plan5 = planFor('5e');
  const placer: { current: ((spots: readonly MapSpotOnScreen[]) => void) | null } = { current: null };
  const { container } = render(
    <MapLabels places={plan5.places} openPlaces={placesOfLands(plan5, ['frondaisons'])} closedLands={linkedLands(plan5)} onPick={() => {}} placer={placer} onClosed={() => {}} states={{}} words={words} upper={plan5.upper} />,
  );
  for (const p of plan5.places) {
    const el = container.querySelector<HTMLElement>(`[data-lieu="${p.id}"]`)!;
    const up = el.querySelector('.open-world-map-up');
    expect(Boolean(up), p.id).toBe(plan5.upper.includes(p.id));
    if (!up) continue;
    // Collé au nom, qui tient sur une ligne et ne se coupe pas ; sur l'icône d'un lieu pâle, qui n'a pas de nom écrit.
    const name = el.querySelector('.open-world-map-lines');
    if (name) expect(name.contains(up), p.id).toBe(true);
    else expect(up.closest('.open-world-map-up-badge'), p.id).not.toBeNull();
    expect(el.getAttribute('aria-label')).toMatch(new RegExp(`${p.name}(, en option)?, en haut`));
  }
  const keo = container.querySelector<HTMLElement>('[data-lieu="keo"]')!;
  placer.current!([{ id: 'keo', x: 10, y: 10, shown: true, up: true }]);
  expect(keo.dataset.haut).toBe('oui');
  expect(keo.getAttribute('aria-label')).toBe('Toi : Kéo est ici, en haut');
  placer.current!([{ id: 'keo', x: 10, y: 10, shown: true, up: false }]);
  expect(keo.dataset.haut).toBe('non');
  expect(keo.getAttribute('aria-label')).toBe('Toi : Kéo est ici');
  // Réduits à leur icône (au plus grand texte, sur un téléphone), un lieu du plateau et Kéo gardent leur triangle,
  // collé à l'icône (référent dys, relecture du lot 2) : un insigne dans l'icône du lieu, dans la pastille de Kéo.
  for (const p of plan5.places) {
    const badge = container.querySelector(`[data-lieu="${p.id}"] .open-world-map-icon .open-world-map-up-badge .open-world-map-up`);
    expect(Boolean(badge), p.id).toBe(plan5.upper.includes(p.id));
  }
  expect(keo.querySelector('.open-world-map-keo-disc .open-world-map-up-badge .open-world-map-up')).not.toBeNull();
});

test('la pastille de Kéo seule, sans le mot « Toi » à l’écran, garde son nom « Toi » pour la voix et le lecteur d’écran (directeur artistique, seconde passe des habitants du 5e)', () => {
  const plan5 = planFor('5e');
  const placer: { current: ((spots: readonly MapSpotOnScreen[]) => void) | null } = { current: null };
  const { container, getByRole } = render(
    <MapLabels places={plan5.places} openPlaces={placesOfLands(plan5, ['frondaisons'])} closedLands={linkedLands(plan5)} onPick={() => {}} placer={placer} onClosed={() => {}} states={{}} words={words} upper={plan5.upper} />,
  );
  placer.current!([{ id: 'keo', x: 10, y: 10, shown: true, up: false }]);
  const keo = container.querySelector<HTMLElement>('[data-lieu="keo"]')!;
  // Le mot et la pastille sont tus : le nom est celui de l'étiquette entière, que le mot se montre ou non (`data-nom`).
  expect(keo.querySelector('.open-world-map-keo-word')!.getAttribute('aria-hidden')).toBe('true');
  expect(keo.querySelector('.open-world-map-keo-disc')!.getAttribute('aria-hidden')).toBe('true');
  for (const nom of ['non', 'oui']) {
    keo.dataset.nom = nom;
    expect(getByRole('img', { name: 'Toi : Kéo est ici' }), nom).toBe(keo);
  }
});

test('le nom de chaque terre fermée sous le cadenas de son passage, aux quatre niveaux (piste B), et au 5e la cabine devant celui des Aiguilles', () => {
  const plan5 = planFor('5e');
  const { container, unmount } = render(
    <MapLabels places={plan5.places} openPlaces={placesOfLands(plan5, ['frondaisons'])} closedLands={linkedLands(plan5)} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={{}} words={words} upper={plan5.upper} />,
  );
  for (const land of linkedLands(plan5)) {
    const name = container.querySelector(`[data-lieu="${bridgeSpot(land)}"] .open-world-map-closed-name`);
    expect(name, land).toHaveTextContent(landById(land).name);
    expect(Boolean(name!.querySelector('svg')), land).toBe(land === 'aiguilles');
  }
  unmount();
  for (const level of ['6e', '4e', '3e'] as const) {
    const plan = planFor(level);
    const { container, unmount: done } = render(<MapLabels places={plan.places} openPlaces={placesOfLands(plan, [plan.lands[0].id])} closedLands={linkedLands(plan)} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={{}} words={words} />);
    for (const land of linkedLands(plan)) expect(container.querySelector(`[data-lieu="${bridgeSpot(land)}"] .open-world-map-closed-name`), `${level} ${land}`).toHaveTextContent(landById(land).name);
    done();
  }
});

test('au 6e, aucun triangle « en haut »', () => {
  const { container } = render(
    <MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states} words={words} upper={PLAN.upper} />,
  );
  expect(container.querySelector('.open-world-map-up')).toBeNull();
});

test('le prochain lieu suggéré : sa pastille seule porte la marque (double contour) et dit qu’elle est l’étape, au 5e comme au 6e', () => {
  const plan5 = planFor('5e');
  const five = render(
    <MapLabels places={plan5.places} openPlaces={placesOfLands(plan5, ['frondaisons'])} closedLands={linkedLands(plan5)} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={{}} words={words} upper={plan5.upper} nextPlace="radeaux" />,
  );
  expect([...five.container.querySelectorAll<HTMLElement>('.open-world-map-place.suggested')].map((b) => b.dataset.lieu)).toEqual(['radeaux']);
  expect(five.container.querySelector('[data-lieu="radeaux"]')).toHaveAttribute('aria-current', 'step');
  expect(five.container.querySelector('[data-lieu="montee"]')).not.toHaveAttribute('aria-current');
  five.unmount();
  const six = render(<MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states} words={words} nextPlace="phare" />);
  expect([...six.container.querySelectorAll<HTMLElement>('.open-world-map-place.suggested')].map((b) => b.dataset.lieu)).toEqual(['phare']);
  six.unmount();
  // Sans prochain lieu (la suggestion est derrière un pont), aucune pastille marquée.
  const none = render(<MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states} words={words} />);
  expect(none.container.querySelector('.open-world-map-place.suggested')).toBeNull();
});

test('un lieu d’option (l’Oracle, l’Auberge) porte le fanion collé à son nom, dit « en option » ; les autres non (choix du mainteneur, « Fanion »)', () => {
  const plan5 = planFor('5e');
  const states5 = Object.fromEntries(plan5.places.map((p) => [p.id, null])) as never;
  const { container } = render(
    <MapLabels places={plan5.places} openPlaces={plan5.places.map((p) => p.id)} closedLands={[]} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states5} words={words} upper={plan5.upper} />,
  );
  const flagged = [...container.querySelectorAll<HTMLElement>('.open-world-map-place')].filter((b) => b.querySelector('.open-world-map-option')).map((b) => b.dataset.lieu);
  expect(flagged.sort()).toEqual(['auberge', 'oracle']);
  const oracle = container.querySelector<HTMLElement>('[data-lieu="oracle"]')!;
  expect(oracle.getAttribute('aria-label')).toMatch(/^Y aller : L’Oracle, en option/);
  // Collé au nom, dans son bloc, qui tient sur une ligne : jamais seul.
  const name = oracle.querySelector('.open-world-map-option')!.closest('.open-world-map-lines')!;
  expect(name).toHaveTextContent('L’Oracle');
  expect(container.querySelector('[data-lieu="hameau"]')!.getAttribute('aria-label')).not.toMatch(/en option/);
});

test('aux quatre niveaux, le nom sur une ligne puis l’icône de l’état à côté, sa place gardée dès la ruine ; plus de forme serrée ni de trait (piste B)', () => {
  for (const level of ['6e', '5e', '4e', '3e'] as const) {
    const plan = planFor(level);
    const open = plan.places.map((p) => p.id);
    // Un lieu restauré, un en chantier, les autres à explorer.
    const states4 = { ...Object.fromEntries(open.map((id) => [id, null])), [open[0]]: 'restauree', [open[1]]: 'en-chantier' } as never;
    const { container, unmount } = render(<MapLabels places={plan.places} openPlaces={open} closedLands={[]} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states4} words={words} upper={plan.upper} />);
    expect(container.querySelector('.open-world-map-places'), level).not.toHaveClass('snug');
    expect(container.querySelector('.open-world-map-leads'), level).toBeNull();
    expect(container.querySelector('.open-world-map-state-glued, .open-world-map-line'), level).toBeNull();
    for (const p of plan.places) {
      const el = container.querySelector<HTMLElement>(`[data-lieu="${p.id}"]`)!;
      // Le nom entier, d'un bloc.
      expect(el.querySelector('.open-world-map-lines'), p.id).toHaveTextContent(p.name);
      expect(el.querySelector('.open-world-map-place-name .open-world-map-state'), p.id).toBeNull();
      expect(el.querySelector(':scope > .open-world-map-state')!.getAttribute('data-etat'), p.id).toBe(p.id === open[0] ? 'restauree' : p.id === open[1] ? 'en-chantier' : 'a-explorer');
    }
    unmount();
  }
});

test('le texte de la Carte plafonné à 24 px, jamais sous 18 px, ses marges en em ; plus de forme serrée (openWorld.css, piste B)', () => {
  const css = readFileSync(join(process.cwd(), 'src/game/three/archipeo/openWorld.css'), 'utf8');
  const rule = (selector: string) => css.match(new RegExp(`\\n${selector.replace(/[.[\]()]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';
  expect(rule('.open-world-map-places')).toMatch(/font-size: clamp\(18px, 1rem, 24px\);/);
  expect(rule('.open-world-map-place')).toMatch(/padding: 0\.3em 0\.9em;/);
  expect(css).not.toMatch(/data-nom='serre'|data-lignes|open-world-map-leads/);
});
