// Le mode « Aménager » à l'écran (GD-9, point 1) : « Modifier le plan » l'ouvre ; choisir un lieu ; peu de boutons sur
// la Carte (mainteneur, 7 octobre 2026 : « il y a trop de boutons ») : la barre n'a que « Annuler » et « Valider »,
// « Réunir » près d'un voisin, « Poser » pour un ouvrage à reposer ; autour du choix, « Tourner » seul (les flèches pour
// un ouvrage). Toucher la mer relâche le choix ; glissé au doigt, il se pose au lever ; une borne se pose en touchant
// une place de son lieu ; au clavier, les flèches le décalent jusqu'à « Plus de place par là » et Entrée le pose (avec son geste, qu'un toucher
// termine ; d'un coup avec moins d'animations). La vue simple garde sa croix, « Tourner », ↶ et « Poser ». « Valider » ou
// « Annuler » (et Échap) ferment le mode ; la pastille des liaisons à reposer, et le mot expliqué la première fois ; la
// ligne de signes (piste A), dite en mots.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { SettingsProvider } from '../core/SettingsContext';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BiomeId } from './biomes';
import type { World } from './engine/state';
import { type Amenagement, QUESTION_D_ANNULATION, useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeSentence } from './ArrangeBar';
import { Icon } from '../components/Icon';
import { ArrangeHandles } from './ArrangeHandles';
import { HABILLAGES } from './world/skin';
import { toutConstruit } from './world/budget';
import { freeGuardianSpots, freeSpots, freeStationSpots, guardianOf, isletMiddle, joinedWith, linksToRelink, nearestFreeSpot, NO_MORE_ROOM, placeIn, spotOf, stationOf } from './world/arrange';
import { frameOf } from './world/footprint';
import { DESCENTE_MS, GESTE_DU_LIEU } from './world/arrangeGesture';
import { stationInWorld } from './world/arrangeMode';
import { startingStations } from './world/terrain/markers';
import { applyLayout } from './world/appliedLayout';
import { thePlace } from './world/placeArticle';

vi.mock('./sound', async (original) => ({ ...(await original<typeof import('./sound')>()), playClac: vi.fn(), playPlace: vi.fn() }));

const VOLCAN = 'maths-6e-decimals' as const;
const TOUR = 'french-6e-reading' as const;
const FERME = 'french-6e-grammar-spelling' as const;
// Les noms du jeu pour la Tour et la Ferme (deux noms féminins, pour l'accord de « réunie ») ; l'identifiant pour les autres.
const NOMS: Record<string, string> = { [TOUR]: 'Tour du lecteur', [FERME]: 'Ferme des accords' };
const nom = (id: string) => NOMS[id] ?? id;

let dernier: Amenagement;
let monde: World;

function Banc({
  reduit,
  depart,
  dire = () => {},
  a: archipel = '6e',
  croix = false,
}: {
  reduit: boolean;
  depart: World;
  dire?: (texte: string) => void;
  a?: '6e' | '5e' | '4e' | '3e';
  /** La vue simple : la barre avec sa croix de flèches, sans poignées autour du choix. */
  croix?: boolean;
}) {
  const [world, setWorld] = useState<World>(depart);
  monde = world;
  const a = useAmenagement({
    world,
    a: archipel,
    arrange: (next) => {
      const { layout: _l, ...reste } = world;
      setWorld({ ...reste, links: next.links, ...(next.layout ? { layout: next.layout } : {}) });
    },
    nom,
    reduceMotion: reduit,
    habillage: HABILLAGES.blocland,
    sons: true,
    dire,
    versMonde: (p) => ({ x: p.local.x, y: p.local.y, z: p.local.z }),
    // Le plus haut cube de chaque lieu : 7 cases au-dessus du sol.
    hautDuLieu: () => 7,
  });
  dernier = a;
  return (
    <>
      {!a.ouvert && <ArrangeButton amenagement={a} />}
      <ArrangeSentence amenagement={a} nom={nom} />
      {a.ouvert && !croix && <ArrangeHandles amenagement={a} />}
      {a.ouvert && <ArrangeBar amenagement={a} croix={croix} />}
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  applyLayout(undefined);
  localStorage.clear();
});

const depart = () => toutConstruit().world;
/** Une touche du clavier, sur la fenêtre (hors d'un bouton). */
const touche = (key: string) => fireEvent.keyDown(window, { key });
/** Les boutons de la barre du bas, dans l'ordre, par leur nom. */
/**
 * Le lieu choisi, glissé au doigt jusqu'à la place libre la plus proche de `point` (en cases du monde), puis lâché :
 * toucher la mer ne le déplace plus, elle le relâche (mainteneur, 7 octobre 2026).
 */
const glisseVers = (id: BiomeId, point: { x: number; y: number }) => {
  const libre = nearestFreeSpot(monde, id, point)!;
  const ici = placeIn(monde, id).core;
  const c = frameOf('6e');
  act(() => void dernier.glisser.prendre({ x: ici.x + 8, y: ici.y + 8 }, { lieu: id }));
  act(() => dernier.glisser.suivre({ x: c.x0 + libre.x * 4 + 8, y: c.y0 + libre.y * 4 + 8 }));
  act(() => dernier.glisser.lacher(true));
  return libre;
};
/** L'icône de « Réunir » la plus proche du lieu choisi : elle ne se montre que pendant le glissé. */
const iconeDeReunion = (id: BiomeId) => {
  const ici = placeIn(monde, id).core;
  act(() => void dernier.glisser.prendre({ x: ici.x + 8, y: ici.y + 8 }, { lieu: id }));
  const icone = dernier.vue?.reunions?.[0];
  act(() => dernier.glisser.lacher(false));
  return icone;
};
const boutonsDeLaBarre = () => Array.from(document.querySelectorAll('.arrange-bar button')).map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim());

describe('le mode « Aménager »', () => {
  it('« Tourner » un Gardien le pose tout de suite, et la phrase le dit', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'creature', id: VOLCAN, gardien: true }));
    // La ligne de signes, comme un lieu : son île pour repère, la flèche, l'écart ; dite en mots.
    expect(screen.getByRole('status').textContent).toMatch(/^Le Gardien : (au|à l’) [a-z-]+ du [^,]+, à \d+ cases?\.$/);
    expect(dernier.ligne?.genre).toBe('gardien');
    expect(document.querySelector('.arrange-signes')?.textContent).toContain(VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: /Tourner/ }));
    // Plus de « C’est posé » : la ligne dit où il regarde, le son de la pose suffit.
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(screen.getByRole('status').textContent).not.toBe('');
  });

  it('« Tourner » un lieu qui, tourné, n’a aucune place libre : le fantôme ne tourne pas, la ligne le refuse (HG-3)', () => {
    const GLACIER = 'maths-5e-signed-numbers' as const;
    render(<SettingsProvider><Banc reduit depart={depart()} a="5e" /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: GLACIER }));
    const avant = dernier.choix;
    if (avant?.genre !== 'lieu') throw new Error('lieu');
    fireEvent.click(within(screen.getByRole('group', { name: 'Déplacer' })).getByRole('button', { name: 'Tourner' }));
    // Une croix et deux ou trois mots, comme les autres refus ; le fantôme garde son orientation.
    expect(dernier.ligne).toEqual({ genre: 'refus', icone: 'close', texte: 'Pas de place' });
    expect(screen.getByRole('status').textContent).toBe('Pas de place.');
    expect(dernier.choix).toEqual(avant);
  });

  it('choisir, décaler au clavier, poser à Entrée (moins d’animations), défaire, la mer touchée relâche, glisser pose, puis « Annuler » remet le plan comme à l’entrée', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    expect(screen.getByRole('status').textContent).toMatch(/Touche un lieu/);
    // Peu de boutons sur la Carte : sans choix ni voisin, la barre n'a que « Annuler » et « Valider », ✓ mis en avant ;
    // ni « Poser », ni ↶, ni « Réunir », ni flèche.
    expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Valider']);
    expect(screen.getByRole('button', { name: 'Valider' }).className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: 'Annuler' }).className).not.toMatch(/primary/);
    expect(screen.queryByRole('button', { name: 'Nord' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix?.genre).toBe('lieu');
    // Un lieu choisi, sans voisin à réunir : toujours les deux mêmes boutons, « Valider » toujours mis en avant.
    expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Valider']);
    expect(screen.getByRole('button', { name: 'Valider' }).className).toMatch(/primary/);
    // Autour du choix, hors de la barre : « Tourner » seul (on déplace en glissant ou en touchant la place voulue).
    const autour = screen.getByRole('group', { name: 'Déplacer' });
    expect(autour.closest('.arrange-bar')).toBeNull();
    expect(within(autour).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Tourner']);
    expect(dernier.vue?.poignees?.liste.map((q) => q.cle)).toEqual(['tourner']);
    // Une poignée qui ne sert pas : son bouton reste là, `aria-disabled`.
    for (const q of dernier.vue!.poignees!.liste) {
      const b = autour.querySelector(`[data-cle="${q.cle}"]`)!;
      expect(b.getAttribute('aria-disabled'), q.cle).toBe(q.dispo ? null : 'true');
    }
    expect(dernier.vue?.cases.length).toBeGreaterThan(0);
    // Le nom du lieu choisi se pose sur son fantôme.
    expect(dernier.vue?.nom).toBe(VOLCAN);
    // « Annuler » et « Valider » n'ont pas la même icône (la coche à « Valider », la croix à « Annuler »).
    const icone = (n: RegExp | string) => screen.getByRole('button', { name: n }).querySelector('svg')?.getAttribute('class');
    expect(icone('Annuler')).not.toBe(icone('Valider'));
    // La ligne montre la place en signes (le voisin, la flèche, le nombre, la case), et la dit en mots (le nom du lieu
    // choisi n'est pas répété : il est sur son fantôme).
    expect(screen.getByRole('status').textContent).toMatch(/^(Au [a-z-]+|À l’[a-z-]+) (de la |du |de l’)[^,]+, à \d+ cases?\.$/);
    expect(dernier.ligne?.genre).toBe('place');
    const signes = document.querySelector('.arrange-signes')!;
    expect(signes).toHaveAttribute('aria-hidden', 'true');
    if (dernier.ligne?.genre === 'place') {
      const { voisin, cases } = dernier.ligne.signes;
      // L'ordre de la voix : le nom du voisin, la flèche, le nombre, la case.
      expect(signes.textContent).toMatch(new RegExp(`^${voisin} [a-z-]+ ${cases}case`));
      expect(signes.querySelectorAll('svg')).toHaveLength(2);
    }
    // Les flèches du clavier, jusqu'au bord : « Plus de place par là ».
    for (let i = 0; i < 60 && !screen.getByRole('status').textContent?.includes(NO_MORE_ROOM); i++) touche('ArrowLeft');
    expect(screen.getByRole('status').textContent).toBe(NO_MORE_ROOM);
    // Le refus reste écrit, à côté de la croix.
    expect(document.querySelector('.signe-refus')?.textContent).toMatch(/Plus de place par là/);
    // Au bord, la place peut être prise : on revient d'un cran à la fois jusqu'à une place libre.
    for (let i = 0; i < 60 && dernier.placePrise; i++) touche('ArrowRight');
    expect(dernier.placePrise).toBe(false);
    const avant = spotOf(monde, VOLCAN);
    // Entrée pose le choix décalé aux flèches.
    touche('Enter');
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    // Après une pose, plus de « C’est posé » : la ligne de place se met à jour.
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(dernier.ligne?.genre).toBe('place');
    // ↶ (dans la vue simple ; la Carte ne le montre plus) défait la pose.
    expect(screen.queryByRole('button', { name: 'Défaire la dernière pose' })).toBeNull();
    expect(dernier.peutDefaire).toBe(true);
    act(() => dernier.defaire());
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    // Toucher la mer relâche le choix, sans rien bouger ni poser.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 120 } }));
    expect(dernier.choix).toBeNull();
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    expect(dernier.peutDefaire).toBe(false);
    // Glissé jusqu'à une place libre (le coin du fond, à l'ouest, loin de tout voisin à réunir) : posé au lever du doigt.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    glisseVers(VOLCAN, { x: 0, y: 120 });
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    expect(dernier.choix).toBeNull();
    expect(dernier.ligne?.genre).toBe('place');
    // Quelque chose a bougé : « Annuler » demande d'abord. « Garder » prend sa place, l'« Annuler » qui confirme se pose
    // juste avant ; « Valider » ne bouge pas.
    const fin = () => Array.from(document.querySelectorAll('.arrange-bar-fin button')).map((b) => b.textContent?.trim());
    expect(fin()).toEqual(['Annuler', 'Valider']);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(fin()).toEqual(['Garder', 'Valider']);
    expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Garder', 'Valider']);
    // « Garder » porte l'icône du mode (on continue d'aménager), celle de « Modifier le plan », pas la flèche de retour.
    const dessin = (name: 'amenager' | 'back') => render(<Icon name={name} />).container.querySelector('svg')?.innerHTML;
    const garder = document.querySelector('.arrange-garder svg')?.innerHTML;
    expect(garder).toBe(dessin('amenager'));
    expect(garder).not.toBe(dessin('back'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    expect(dernier.ouvert).toBe(false);
  });

  it('en vue simple, la barre garde la croix des flèches, « Tourner », ↶ et « Poser » ; ↶ défait la pose', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} croix /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const barre = document.querySelector('.arrange-bar')!;
    const croix = within(barre as HTMLElement).getByRole('group', { name: 'Déplacer' });
    for (const n of ['Nord', 'Sud', 'Ouest', 'Est']) expect(within(croix).getByRole('button', { name: n })).toBeInTheDocument();
    expect(within(barre as HTMLElement).getByRole('button', { name: 'Tourner' })).toBeInTheDocument();
    // Rien à défaire encore : ↶ éteint ; « Poser » mis en avant pendant le choix ; « Réunir » est dans la liste de la vue simple.
    expect(screen.getByRole('button', { name: 'Défaire la dernière pose' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Poser' }).className).toMatch(/primary/);
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    // Un cran à l'ouest, à la croix, jusqu'à une place libre, puis « Poser ».
    const avant = spotOf(monde, VOLCAN);
    fireEvent.click(within(croix).getByRole('button', { name: 'Ouest' }));
    for (let i = 0; i < 60 && dernier.placePrise; i++) fireEvent.click(within(croix).getByRole('button', { name: 'Ouest' }));
    expect(screen.getByRole('button', { name: 'Poser' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    // « Défaire » : l'icône, nommée ; son mot est là pour le grand texte.
    const defaire = screen.getByRole('button', { name: 'Défaire la dernière pose' });
    expect(defaire).toHaveTextContent('Défaire');
    expect(defaire).toBeEnabled();
    fireEvent.click(defaire);
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
  });

  it('glisser le lieu choisi au doigt (choix 1b, 2a, 3a) : seul un glissé parti de lui le prend ; levé sur une place libre, il est posé avec son « clac »', () => {
    vi.useFakeTimers();
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit={false} depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    // Rien de choisi : aucun glissé ne prend rien (la vue glisse).
    const ici = placeIn(monde, VOLCAN).core;
    expect(dernier.glisser.prendre({ x: ici.x + 8, y: ici.y + 8 }, { lieu: VOLCAN })).toBe(false);
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const depart0 = spotOf(monde, VOLCAN);
    // Un glissé parti de la mer au loin : la vue glisse, le lieu reste.
    let pris = true;
    act(() => void (pris = dernier.glisser.prendre({ x: ici.x + 80, y: ici.y + 80 }, {})));
    expect(pris).toBe(false);
    expect(dernier.glisse).toBe(false);
    // Parti de sa terre : il suit le doigt ; la grille et l'empreinte se dessinent, les flèches se cachent.
    act(() => void (pris = dernier.glisser.prendre({ x: ici.x + 8, y: ici.y + 8 }, { lieu: VOLCAN })));
    expect(pris).toBe(true);
    expect(dernier.glisse).toBe(true);
    expect(dernier.vue?.poignees).toBeUndefined();
    expect(dernier.vue?.cases.some((k) => k.genre === 'grille')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Nord' })).toBeNull();
    const libre = freeSpots(monde, VOLCAN).find((q) => Math.abs(q.x - depart0.x) + Math.abs(q.y - depart0.y) > 3)!;
    const c = frameOf('6e');
    const dits = dit.length;
    act(() => dernier.glisser.suivre({ x: c.x0 + libre.x * 4 + 8, y: c.y0 + libre.y * 4 + 8 }));
    expect(dernier.choix).toMatchObject({ genre: 'lieu', spot: libre });
    // La ligne suit, sans la voix : elle parle au lever.
    expect(dit.length).toBe(dits);
    act(() => dernier.glisser.lacher(true));
    // Posé tout de suite, à sa nouvelle place, sans le démontage couche par couche : il redescend d'un cube, puis le
    // « clac » et la voix ; les flèches sont parties avec le choix.
    expect(spotOf(monde, VOLCAN)).toEqual(libre);
    expect(dernier.geste).toMatchObject({ phase: 'descend', dureeMs: DESCENTE_MS });
    expect(dit.length).toBe(dits);
    act(() => void vi.advanceTimersByTime(DESCENTE_MS));
    expect(dernier.geste).toBeNull();
    expect(dit.length).toBe(dits + 1);
    expect(dernier.glisse).toBe(false);
    vi.useRealTimers();
    // ↶ rattrape (la vue simple le montre ; sur la Carte, plus de bouton).
    expect(screen.queryByRole('button', { name: /Défaire/ })).toBeNull();
    act(() => dernier.defaire());
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
  });

  it('levé sur une place prise, le lieu glissé reste là : croix grise, ni « Poser » ni Entrée ne le posent (choix 2a) ; interrompu, rien n’est posé', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const depart0 = spotOf(monde, VOLCAN);
    const ici = placeIn(monde, VOLCAN).core;
    const voisin = placeIn(monde, TOUR).core;
    act(() => void dernier.glisser.prendre({ x: ici.x + 4, y: ici.y + 4 }, { lieu: VOLCAN }));
    act(() => dernier.glisser.suivre({ x: voisin.x + 4, y: voisin.y + 4 }));
    expect(dernier.vue?.cases.some((k) => k.genre === 'conflit')).toBe(true);
    expect(dernier.vue?.cases.some((k) => k.genre === 'barre')).toBe(true);
    act(() => dernier.glisser.lacher(true));
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
    expect(dernier.placePrise).toBe(true);
    expect(dernier.vue?.poignees?.prise).toBeDefined();
    // Pas de « Poser » sur la Carte ; Entrée ne pose rien sur une place prise.
    expect(screen.queryByRole('button', { name: 'Poser' })).toBeNull();
    touche('Enter');
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
    expect(dernier.placePrise).toBe(true);
    // Un glissé interrompu (un second doigt) : rien n'est posé, même sur une place libre.
    const libre = freeSpots(monde, VOLCAN).find((q) => Math.abs(q.x - depart0.x) + Math.abs(q.y - depart0.y) > 3)!;
    const c = frameOf('6e');
    const fantome = dernier.choix?.genre === 'lieu' ? dernier.choix.spot : depart0;
    act(() => void dernier.glisser.prendre({ x: c.x0 + fantome.x * 4 + 8, y: c.y0 + fantome.y * 4 + 8 }, {}));
    act(() => dernier.glisser.suivre({ x: c.x0 + libre.x * 4 + 8, y: c.y0 + libre.y * 4 + 8 }));
    act(() => dernier.glisser.lacher(false));
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
    expect(dernier.choix).toMatchObject({ genre: 'lieu', spot: libre });
  });

  it('un Gardien se glisse loin de son lieu (choix 4a) : posé au lever, son îlot détaché', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'creature', id: VOLCAN, gardien: true }));
    const ici = isletMiddle(monde, VOLCAN, guardianOf(monde, VOLCAN));
    act(() => void dernier.glisser.prendre(ici, { gardien: VOLCAN }));
    expect(dernier.glisse).toBe(true);
    const loin = freeGuardianSpots(monde, VOLCAN).filter((g) => g.spot).map((g) => isletMiddle(monde, VOLCAN, g)).find((m) => Math.hypot(m.x - ici.x, m.y - ici.y) > 30)!;
    act(() => dernier.glisser.suivre(loin));
    expect(dernier.vue?.cases.some((k) => k.genre === 'lien')).toBe(true);
    act(() => dernier.glisser.lacher(true));
    expect(guardianOf(monde, VOLCAN).spot).toBeDefined();
    // Avec moins d'animations : posé d'un coup, sans descente.
    expect(dernier.geste).toBeNull();
  });

  it('« Valider » pose le choix en cours et garde le plan ; Échap n’annule jamais ; « Annuler » demande, sauf sans changement', () => {
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    const entree = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    // Décalé au clavier jusqu'à une place libre, sans le poser.
    touche('ArrowLeft');
    for (let i = 0; i < 60 && dernier.placePrise; i++) touche('ArrowLeft');
    expect(spotOf(monde, VOLCAN)).toEqual(entree);
    // « Valider » pendant un choix : il le pose d'abord, puis ferme.
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(dernier.ouvert).toBe(false);
    const posee = spotOf(monde, VOLCAN);
    expect(posee).not.toEqual(entree);
    // Échap : il désélectionne le choix, puis ne fait plus rien ; il n'annule jamais.
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    // Glissé sur une place libre : posé au lever du doigt.
    glisseVers(VOLCAN, { x: 190, y: 140 });
    const deplacee = spotOf(monde, VOLCAN);
    expect(deplacee).not.toEqual(posee);
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dernier.choix).toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dernier.ouvert).toBe(true);
    expect(spotOf(monde, VOLCAN)).toEqual(deplacee);
    // « Annuler » demande ; Échap ferme la question, « Garder » aussi : rien n'est remis.
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(dernier.aConfirmer).toBe(true);
    expect(dit.at(-1)).toBe(QUESTION_D_ANNULATION);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dernier.aConfirmer).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder' }));
    expect(dernier.ouvert).toBe(true);
    expect(spotOf(monde, VOLCAN)).toEqual(deplacee);
    // Confirmé : le plan revient à l'entrée du mode.
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(dernier.ouvert).toBe(false);
    expect(spotOf(monde, VOLCAN)).toEqual(posee);
    expect(dit.at(-1)).toBe('Le plan est remis comme avant.');
    // Rien de changé : « Annuler » ferme tout de suite, sans rien dire.
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const avant = dit.length;
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(dernier.ouvert).toBe(false);
    expect(dit.slice(avant).filter((t) => /remis|comme avant/.test(t))).toHaveLength(0);
  });

  it('une flèche du clavier avance d’un cran, même sur une place prise : la croix et « Place prise », Entrée ne pose rien (choix 3)', () => {
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const depart0 = spotOf(monde, VOLCAN);
    let vu = false;
    for (const dir of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      // Relâché (Échap), puis choisi de nouveau à sa place : retoucher le lieu choisi le relâcherait.
      fireEvent.keyDown(window, { key: 'Escape' });
      act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
      for (let i = 0; i < 40 && !vu; i++) {
        const c = dernier.choix;
        touche(dir);
        if (dernier.choix === c) break;
        // Un seul cran de la grille à chaque fois, jamais un saut.
        if (c?.genre === 'lieu' && dernier.choix?.genre === 'lieu') expect(Math.abs(dernier.choix.spot.x - c.spot.x) + Math.abs(dernier.choix.spot.y - c.spot.y)).toBe(1);
        vu = dernier.placePrise;
      }
      if (vu) break;
    }
    expect(vu).toBe(true);
    expect(dernier.vue?.poignees?.prise).toBeDefined();
    expect(document.querySelector('.signe-refus')?.textContent).toMatch(/Place prise/);
    // Sur la même ligne que les signes de la place, sans nombre ni case (il n'y a pas d'écart à dire).
    const ligne = document.querySelector('.arrange-signes')!;
    expect(ligne.querySelector('.signe-refus')).not.toBeNull();
    expect(ligne.querySelector('.signes-de-place strong')).toBeNull();
    expect(dit.at(-1)).toMatch(/^(Au|À l’) [^,]+ (du |de la |de l’|des ).+\. Place prise\.$/);
    // Entrée ne pose rien sur une place prise : le choix reste là, croix grise.
    touche('Enter');
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
    expect(dernier.placePrise).toBe(true);
    // « Valider » non plus.
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
  });

  it('sans clavier, retoucher le lieu choisi sur sa terre le relâche, comme Échap', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix?.genre).toBe('lieu');
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix).toBeNull();
    // Un autre lieu touché, lui, est choisi.
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    expect(dernier.choix?.genre === 'lieu' && dernier.choix.id).toBe(TOUR);
  });

  it('posé au doigt sur une place à l’icône de « Réunir », le lieu reste choisi et « Réunir » apparaît (choix 2a)', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    // La Tour, éloignée de la Ferme, puis rapprochée sur une place qui l'y colle.
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    const icone = iconeDeReunion(TOUR);
    expect(icone).toBeDefined();
    const avant = spotOf(monde, TOUR);
    glisseVers(TOUR, { x: icone!.x, y: icone!.y });
    expect(spotOf(monde, TOUR)).not.toEqual(avant);
    expect(dernier.choix?.genre).toBe('lieu');
    expect(screen.getByRole('button', { name: 'Réunir' })).toBeEnabled();
  });

  it('une borne, qu’on ne glisse pas, se pose en touchant une place de son lieu ; à sa place d’avant, rien n’est posé', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const mission = startingStations(VOLCAN)[0].typeId;
    const cle = `${VOLCAN}:${mission}`;
    const sol = (p: { x: number; y: number }) => {
      const m = stationInWorld(monde, cle, p);
      return { ile: VOLCAN, local: { x: m.x, y: m.y, z: 0 } };
    };
    act(() => void dernier.intention({ genre: 'borne', ile: VOLCAN, mission }));
    expect(dernier.choix?.genre).toBe('borne');
    const avant = stationOf(monde, cle)!;
    // Sa place touchée : rien n'est posé, rien à défaire.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN, sol: sol(avant) }));
    expect(stationOf(monde, cle)).toEqual(avant);
    expect(dernier.peutDefaire).toBe(false);
    // Une autre place libre de la bande : posée tout de suite.
    const libre = freeStationSpots(monde, cle).find((q) => q.x !== avant.x || q.y !== avant.y)!;
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN, sol: sol(libre) }));
    expect(stationOf(monde, cle)).toEqual(libre);
    expect(dernier.peutDefaire).toBe(true);
  });

  it('Entrée ne pose rien pendant la question de « Réunir »', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    const icone = iconeDeReunion(TOUR)!;
    glisseVers(TOUR, { x: icone.x, y: icone.y });
    const ici = spotOf(monde, TOUR);
    const pas = dernier.peutDefaire;
    fireEvent.click(screen.getByRole('button', { name: 'Réunir' }));
    const q = () => screen.queryByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` });
    expect(q()).not.toBeNull();
    touche('Enter');
    expect(q()).not.toBeNull();
    expect(spotOf(monde, TOUR)).toEqual(ici);
    expect(dernier.peutDefaire).toBe(pas);
  });

  it('« Valider » sur une place prise : le choix reste à sa place d’avant, rien de posé ne se perd', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    // Le coin libre du fond, à l'ouest : le coin de devant porte le Hangar des inventions depuis SC-2.
    glisseVers(VOLCAN, { x: 0, y: 120 });
    const posee = spotOf(monde, VOLCAN);
    // Un choix qui ne se pose pas (un lieu fixe se refuse ; on force ici un choix sur la place d'un autre lieu).
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const c = dernier.choix;
    expect(c?.genre).toBe('lieu');
    if (c?.genre === 'lieu') act(() => dernier.choisirDirect({ ...c, spot: spotOf(monde, TOUR) }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(dernier.ouvert).toBe(false);
    expect(spotOf(monde, VOLCAN)).toEqual(posee);
  });

  it('le geste de la pose dure 1,5 s au plus, et un toucher le termine ; le lever du doigt fait redescendre d’un cube', () => {
    vi.useFakeTimers();
    render(<SettingsProvider><Banc reduit={false} depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const avant = spotOf(monde, VOLCAN);
    // Une place libre au loin, prise au clavier (sans la poser), puis Entrée : le geste du lieu.
    const loin = (de: { x: number; y: number }) => freeSpots(monde, VOLCAN).find((q) => Math.abs(q.x - de.x) + Math.abs(q.y - de.y) > 3)!;
    const c = dernier.choix;
    if (c?.genre !== 'lieu') throw new Error('lieu');
    act(() => dernier.choisirDirect({ ...c, spot: loin(avant) }));
    touche('Enter');
    expect(dernier.geste?.phase).toBe('demonte');
    expect(dernier.choix).toBeNull();
    // Le démontage part du plus haut cube du lieu, pas du vide au-dessus ; le voile d'Archipéo sait où il va.
    expect(dernier.geste?.haut).toBe(8);
    expect(dernier.geste?.autre).toBeDefined();
    expect(GESTE_DU_LIEU.demonteMs + GESTE_DU_LIEU.remonteMs).toBeLessThanOrEqual(1500);
    act(() => void vi.advanceTimersByTime(GESTE_DU_LIEU.demonteMs));
    expect(dernier.geste?.phase).toBe('remonte');
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    act(() => void vi.advanceTimersByTime(GESTE_DU_LIEU.remonteMs));
    expect(dernier.geste).toBeNull();
    // Une autre pose : un toucher pendant le démontage pose tout de suite.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const ici = spotOf(monde, VOLCAN);
    const d = dernier.choix;
    if (d?.genre !== 'lieu') throw new Error('lieu');
    act(() => dernier.choisirDirect({ ...d, spot: loin(ici) }));
    touche('Enter');
    expect(dernier.geste?.phase).toBe('demonte');
    act(() => void dernier.finirLeGeste());
    expect(dernier.geste).toBeNull();
    expect(spotOf(monde, VOLCAN)).not.toEqual(ici);
    // Lâché au doigt sur une place libre : il redescend d'un cube.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const la = spotOf(monde, VOLCAN);
    glisseVers(VOLCAN, { x: 190, y: 140 });
    expect(spotOf(monde, VOLCAN)).not.toEqual(la);
    expect(dernier.geste).toMatchObject({ phase: 'descend', dureeMs: DESCENTE_MS });
    act(() => void vi.advanceTimersByTime(DESCENTE_MS));
    expect(dernier.geste).toBeNull();
  });

  it('la pastille montre les liaisons à reposer ; le mot est expliqué la première fois ; on la repose', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    glisseVers(VOLCAN, { x: 200, y: 200 });
    const n = linksToRelink(monde, '6e').length;
    expect(n).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    // Le bouton dit le nombre, en mots et dans la pastille (icône et nombre).
    const bouton = screen.getByRole('button', { name: new RegExp(`Modifier le plan \\(${n} liaisons? à reposer\\)`) });
    expect(bouton.querySelector('.arrange-count')?.textContent).toBe(String(n));
    fireEvent.click(bouton);
    expect(screen.getByRole('dialog', { name: 'Liaisons à reposer' }).textContent).toMatch(/Une liaison à reposer, c’est/);
    fireEvent.click(screen.getAllByRole('button', { name: /^Entre / })[0]);
    expect(dernier.choix?.genre).toBe('liaison');
    // Un ouvrage à reposer ne se glisse pas : ses quatre flèches autour de lui, et « Poser » dans la barre.
    const autour = screen.getByRole('group', { name: 'Déplacer' });
    for (const f of ['Nord', 'Sud', 'Ouest', 'Est']) expect(within(autour).getByRole('button', { name: f })).toBeInTheDocument();
    expect(within(autour).queryByRole('button', { name: 'Tourner' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Poser' }).closest('.arrange-bar')).not.toBeNull();
    if (dernier.choix?.genre === 'liaison' && dernier.choix.to) {
      fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
      expect(linksToRelink(monde, '6e').length).toBe(n - 1);
    }
    // La deuxième fois, le mot n'est plus expliqué.
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    if (linksToRelink(monde, '6e').length) {
      fireEvent.click(screen.getByRole('button', { name: /Modifier le plan \(/ }));
      expect(screen.getByRole('dialog').textContent).not.toMatch(/Une liaison à reposer, c’est/);
    }
  });
  it('les explications de la première fois (choix 2a) : une phrase, écrite et lue, une seule fois par appareil, même l’application relancée', () => {
    const dit: string[] = [];
    const question = () => {
      render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
      fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
      act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
      fireEvent.click(screen.getByRole('button', { name: 'Réunir' }));
      return screen.getByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` }).querySelector('.arrange-explication')?.textContent ?? null;
    };
    // La première fois sur l'appareil : écrite, une seule phrase, et dite avec la question.
    const premiere = question();
    expect(premiere).toBeTruthy();
    expect(premiere!.trim().split(/[.!?](\s|$)/).filter((x) => x.trim()).length).toBe(1);
    expect(dit.at(-1)).toContain(premiere!);
    // L'application relancée (un nouveau montage, l'appareil garde sa mémoire) : plus d'explication.
    cleanup();
    expect(question()).toBeNull();
    expect(dit.at(-1)).not.toContain(premiere!);
    // Un autre appareil (la mémoire vide) : de nouveau la première fois.
    cleanup();
    localStorage.clear();
    expect(question()).toBe(premiere);
  });
  it('« Réunir » n’apparaît que près d’un voisin à réunir (la Tour), sans place réservée ; la paire réunie, ↶ la défait', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const reunir = () => screen.getByRole('button', { name: 'Réunir' });
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    // Le Volcan, sans voisin à réunir : pas de « Réunir », pas de place éteinte pour lui.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Valider']);
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    expect(reunir()).toBeEnabled();
    // Dans la barre du bas, juste avant « Annuler » (intention du directeur artistique, 6 octobre 2026).
    expect(reunir().closest('.arrange-bar')).not.toBeNull();
    expect(boutonsDeLaBarre()).toEqual(['Réunir', 'Annuler', 'Valider']);
    expect(reunir().className).not.toMatch(/primary/);
    // Le bouton allumé suffit : la ligne ne le redit pas en phrase.
    expect(screen.getByRole('status').textContent).not.toMatch(/réunir/);
    // « Réunir » pose la question (« A ⋈ B 🔒 », le bouton « Réunir », la croix) : rien ne se fait avant la réponse.
    fireEvent.click(reunir());
    expect(joinedWith(monde, TOUR)).toBeNull();
    const question = screen.getByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` });
    // Dite en mots (le haut-parleur, les lecteurs d'écran) ; écrite en signes.
    expect(dernier.phrase).toBe(`Réunir ${thePlace(nom(TOUR))} et ${thePlace(nom(FERME))}\u00a0? Les deux lieux ne se sépareront plus.`);
    expect(question.querySelector('.arrange-signes')!.textContent).toMatch(new RegExp(`^${nom(TOUR)} +${nom(FERME)}`));
    expect(question.querySelector('.arrange-question-buttons')!.textContent).toBe(' Réunir');
    // Pendant la question, rien n'est mis en avant dans la barre ; « Réunir » reste enfoncé.
    expect(document.querySelectorAll('.arrange-bar .primary')).toHaveLength(0);
    expect(reunir()).toHaveAttribute('aria-pressed', 'true');
    // La première fois, une phrase sur la construction de l'univers, sans redire qu'ils ne se sépareront plus.
    expect(question.querySelector('.arrange-explication')!.textContent).toBe('On la bâtit bloc par bloc, comme une grande construction.');
    fireEvent.click(screen.getByRole('button', { name: 'Ne pas réunir' }));
    expect(joinedWith(monde, TOUR)).toBeNull();
    expect(dernier.ligne).toBeNull();
    // La Tour reste choisie : « Réunir » se retouche.
    expect(dernier.choix?.genre === 'lieu' && dernier.choix.id).toBe(TOUR);
    fireEvent.click(reunir());
    // La deuxième fois, le mot n'est plus expliqué.
    expect(screen.getByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` }).querySelector('.arrange-explication')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `Réunir avec ${thePlace(nom(FERME))}` }));
    expect(joinedWith(monde, TOUR)).toBe(FERME);
    const apres = screen.getByRole('status').textContent!;
    // Dit en mots, « réuni » accordé avec le premier lieu (la Tour et la Ferme, deux noms féminins) ; écrit « A ⋈ B ».
    expect(apres).toMatch(/^La Tour du lecteur est réunie à la Ferme des accords\.( (Un ouvrage est|Une liaison est|\d+ (ouvrages|liaisons) sont) à reposer\.)?$/);
    expect(document.querySelector('.arrange-signes')!.textContent).toMatch(/^Tour du lecteur +Ferme des accords/);
    // ↶ (la vue simple le montre ; pas la Carte) défait la réunion.
    expect(screen.queryByRole('button', { name: 'Défaire la dernière pose' })).toBeNull();
    act(() => dernier.defaire());
    expect(joinedWith(monde, TOUR)).toBeNull();
  });

  it('au téléphone : « Annuler » et « Valider » seuls, avec leur mot ; « Tourner » près du choix, en icône nommée ; la même ligne de signes', () => {
    const avant = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('max-width'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
    try {
      render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
      fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
      const barre = document.querySelector('.arrange-bar')!;
      // La rangée qui ferme le mode : « Annuler » et « Valider », leur mot écrit (ce sont les boutons d'action).
      const fin = barre.querySelector('.arrange-bar-fin')!;
      expect(fin.textContent).toMatch(/Annuler/);
      expect(fin.textContent).toMatch(/Valider/);
      // Rien d'autre : ni « Poser », ni ↶.
      expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Valider']);
      expect(barre.querySelector('.arrange-bar-outils .arrange-pose')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Tout remettre comme avant' })).toBeNull();
      expect(screen.queryByRole('button', { name: /Terminé/ })).toBeNull();
      // La ligne : la même qu'à la tablette, des signes, dits en entier.
      act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
      // « Tourner » est dessiné dans le monde : son bouton, transparent, n'a rien à lire, seulement son nom ; pas de flèche.
      const tourner = within(screen.getByRole('group', { name: 'Déplacer' })).getByRole('button', { name: 'Tourner' });
      expect(tourner.textContent).toBe('');
      expect(tourner.closest('.arrange-bar')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Nord' })).toBeNull();
      expect(boutonsDeLaBarre()).toEqual(['Annuler', 'Valider']);
      expect(document.querySelector('.arrange-signes .signes-de-place')).not.toBeNull();
      expect(screen.getByRole('status').textContent).toBe(dernier.phrase);
      expect(dernier.phrase).toMatch(/^(Au [a-z-]+|À l’[a-z-]+) (de la |du |de l’)[^,]+, à \d+ cases?\.$/);
    } finally {
      window.matchMedia = avant;
    }
  });
});
