// Le mode « Aménager » à l'écran (GD-9, point 1) : « Modifier le plan » l'ouvre ; choisir un lieu, toucher la mer (le
// fantôme se cale), les flèches autour du choix jusqu'à « Plus de place par là », « Poser » (avec son geste, qu'un
// toucher termine ; d'un coup avec moins d'animations), ↶ ; « Valider » ou « Annuler » (et Échap) le ferment ; la barre
// ne met en avant qu'un bouton ; la pastille des liaisons à reposer, et le mot expliqué la première fois ; la ligne de
// signes (piste A), dite en mots.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { SettingsProvider } from '../core/SettingsContext';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { World } from './engine/state';
import { type Amenagement, QUESTION_D_ANNULATION, useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeSentence } from './ArrangeBar';
import { Icon } from '../components/Icon';
import { ArrangeHandles } from './ArrangeHandles';
import { HABILLAGES } from './world/skin';
import { toutConstruit } from './world/budget';
import { joinedWith, linksToRelink, NO_MORE_ROOM, spotOf } from './world/arrange';
import { GESTE_DU_LIEU } from './world/arrangeGesture';
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

function Banc({ reduit, depart, dire = () => {}, a: archipel = '6e' }: { reduit: boolean; depart: World; dire?: (texte: string) => void; a?: '6e' | '5e' | '4e' | '3e' }) {
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
      {a.ouvert && <ArrangeHandles amenagement={a} />}
      {a.ouvert && <ArrangeBar amenagement={a} />}
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

  it('choisir, caler, décaler, poser d’un coup (moins d’animations), défaire, puis « Annuler » remet le plan comme à l’entrée', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    expect(screen.getByRole('status').textContent).toMatch(/Touche un lieu/);
    // Rien de choisi : ✓ Valider est mis en avant, « Poser » éteint, aucune flèche (elles se posent autour d'un choix).
    expect(screen.getByRole('button', { name: 'Valider' }).className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: 'Annuler' }).className).not.toMatch(/primary/);
    expect(screen.getByRole('button', { name: 'Poser' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Nord' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix?.genre).toBe('lieu');
    expect(screen.getByRole('button', { name: 'Poser' }).className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: 'Valider' }).className).not.toMatch(/primary/);
    // Les flèches et « Tourner » autour du choix, hors de la barre.
    const autour = screen.getByRole('group', { name: 'Déplacer' });
    expect(autour.closest('.arrange-bar')).toBeNull();
    for (const n of ['Nord', 'Sud', 'Ouest', 'Est', 'Tourner']) expect(within(autour).getByRole('button', { name: n })).toBeInTheDocument();
    // Une poignée qui ne sert pas : son bouton reste là, `aria-disabled` (le toucher dit « Plus de place par là »).
    for (const q of dernier.vue!.poignees!.liste) {
      const b = autour.querySelector(`[data-cle="${q.cle}"]`)!;
      expect(b.getAttribute('aria-disabled'), q.cle).toBe(q.dispo ? null : 'true');
    }
    expect(dernier.vue?.cases.length).toBeGreaterThan(0);
    // Le nom du lieu choisi se pose sur son fantôme.
    expect(dernier.vue?.nom).toBe(VOLCAN);
    // « Poser » et « Valider » n'ont pas la même icône (la coche reste à « Valider », la croix à « Annuler »).
    const icone = (n: RegExp | string) => screen.getByRole('button', { name: n }).querySelector('svg')?.getAttribute('class');
    expect(icone('Poser')).not.toBe(icone('Valider'));
    expect(icone('Annuler')).not.toBe(icone('Valider'));
    // La mer touchée : le fantôme se cale ; la ligne le montre en signes (le voisin, la flèche, le nombre, la case), et
    // le dit en mots (le nom du lieu choisi n'est pas répété : il est sur son fantôme).
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
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
    // Les flèches, jusqu'au bord : « Plus de place par là ».
    for (let i = 0; i < 60 && !screen.getByRole('status').textContent?.includes(NO_MORE_ROOM); i++) fireEvent.click(screen.getByRole('button', { name: /Ouest/ }));
    expect(screen.getByRole('status').textContent).toBe(NO_MORE_ROOM);
    // Le refus reste écrit, à côté de la croix.
    expect(document.querySelector('.signe-refus')?.textContent).toMatch(/Plus de place par là/);
    // Au bord, la place peut être prise : on revient d'un cran à la fois jusqu'à une place libre.
    for (let i = 0; i < 60 && dernier.placePrise; i++) fireEvent.click(screen.getByRole('button', { name: /Est/ }));
    expect(screen.getByRole('button', { name: 'Poser' })).toBeEnabled();
    const avant = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    // Après une pose, plus de « C’est posé » : la ligne de place se met à jour.
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(dernier.ligne?.genre).toBe('place');
    // ↶ défait la pose.
    fireEvent.click(screen.getByRole('button', { name: 'Défaire la dernière pose' }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    // Une autre pose, puis « Annuler » : le plan revient à l'entrée, et le mode se ferme.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    // Quelque chose a bougé : « Annuler » demande d'abord. « Garder » prend sa place, l'« Annuler » qui confirme se pose
    // juste avant, à la place de « Réunir » ; « Valider » ne bouge pas.
    const fin = () => Array.from(document.querySelectorAll('.arrange-bar-fin button')).map((b) => b.textContent?.trim());
    expect(fin()).toEqual(['Annuler', 'Valider']);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(fin()).toEqual(['Garder', 'Valider']);
    const ordre = Array.from(document.querySelectorAll('.arrange-bar button')).map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim());
    expect(ordre.indexOf('Garder')).toBe(ordre.indexOf('Annuler') + 1);
    // Une seule action attend : « Poser » s'éteint pendant la question.
    expect(screen.getByRole('button', { name: 'Poser' })).toBeDisabled();
    // « Garder » porte l'icône du mode (on continue d'aménager), celle de « Modifier le plan », pas la flèche de retour.
    const dessin = (name: 'amenager' | 'back') => render(<Icon name={name} />).container.querySelector('svg')?.innerHTML;
    const garder = document.querySelector('.arrange-garder svg')?.innerHTML;
    expect(garder).toBe(dessin('amenager'));
    expect(garder).not.toBe(dessin('back'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    expect(dernier.ouvert).toBe(false);
  });

  it('« Valider » pose le choix en cours et garde le plan ; Échap n’annule jamais ; « Annuler » demande, sauf sans changement', () => {
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    const entree = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    // « Valider » pendant un choix : il le pose d'abord, puis ferme.
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(dernier.ouvert).toBe(false);
    const posee = spotOf(monde, VOLCAN);
    expect(posee).not.toEqual(entree);
    // Échap : il désélectionne le choix, puis ne fait plus rien ; il n'annule jamais.
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 190, y: 140 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
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

  it('une flèche avance d’un cran, même sur une place prise : la croix et « Place prise », « Poser » éteint (choix 3)', () => {
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    const depart0 = spotOf(monde, VOLCAN);
    let vu = false;
    for (const dir of ['Nord', 'Sud', 'Ouest', 'Est']) {
      // Relâché (Échap), puis choisi de nouveau à sa place : retoucher le lieu choisi le relâcherait.
      fireEvent.keyDown(window, { key: 'Escape' });
      act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
      for (let i = 0; i < 40 && !vu; i++) {
        const c = dernier.choix;
        fireEvent.click(screen.getByRole('button', { name: dir }));
        if (dernier.choix === c) break;
        // Un seul cran de la grille à chaque fois, jamais un saut.
        if (c?.genre === 'lieu' && dernier.choix?.genre === 'lieu') expect(Math.abs(dernier.choix.spot.x - c.spot.x) + Math.abs(dernier.choix.spot.y - c.spot.y)).toBe(1);
        vu = dernier.placePrise;
      }
      if (vu) break;
    }
    expect(vu).toBe(true);
    expect(screen.getByRole('button', { name: 'Poser' })).toBeDisabled();
    expect(dernier.vue?.poignees?.prise).toBeDefined();
    expect(document.querySelector('.signe-refus')?.textContent).toMatch(/Place prise/);
    // Sur la même ligne que les signes de la place, sans nombre ni case (il n'y a pas d'écart à dire).
    const ligne = document.querySelector('.arrange-signes')!;
    expect(ligne.querySelector('.signe-refus')).not.toBeNull();
    expect(ligne.querySelector('.signes-de-place strong')).toBeNull();
    expect(dit.at(-1)).toMatch(/^(Au|À l’) [^,]+ (du |de la |de l’|des ).+\. Place prise\.$/);
    // « Valider » ne pose rien sur une place prise.
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(spotOf(monde, VOLCAN)).toEqual(depart0);
  });

  it('sans choix, chaque bout de liaison porte sa poignée nommée ; la toucher choisit l’arrivée, que les flèches déplacent (choix 1a)', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const groupe = screen.getByRole('group', { name: 'Déplacer une arrivée' });
    const boutons = within(groupe).getAllByRole('button');
    expect(boutons.length).toBe(dernier.bouts!.length);
    expect(boutons.length % 2).toBe(0);
    // « L’arrivée sur la Forêt des sons, de l’ouvrage vers la Ferme des accords » (le mot de l'univers).
    expect(boutons[0].getAttribute('aria-label')).toMatch(/^L’arrivée sur (le |la |l’).+, (de la liaison|de l’ouvrage|du pont) vers (le |la |l’).+/);
    fireEvent.click(boutons[0]);
    expect(dernier.choix?.genre).toBe('arrivee');
    expect(dernier.bouts).toBeNull();
    expect(screen.queryByRole('group', { name: 'Déplacer une arrivée' })).toBeNull();
    const autour = screen.getByRole('group', { name: 'Déplacer' });
    expect(within(autour).queryByRole('button', { name: 'Tourner' })).toBeNull();
    // La ligne dit vers quel lieu l'ouvrage part, en signes : l'icône de l'ouvrage, puis le lieu d'en face.
    expect(dernier.ligne?.genre === 'texte' && dernier.ligne.vers).toBeTruthy();
    expect(document.querySelector('.arrange-signes')!.textContent).toContain(dernier.ligne?.genre === 'texte' ? dernier.ligne.vers : '?');
    // Dit aussi le lieu d'en face, comme le nom du bouton.
    expect(dernier.phrase).toMatch(/^L’arrivée, sur la côte .+, vers (le |la |l’).+\.$/);
    // Retoucher son ouvrage la relâche, comme le lieu, le Gardien ou la borne.
    const ouvrage = dernier.choix?.genre === 'arrivee' ? dernier.choix.link : '';
    act(() => void dernier.intention({ genre: 'ouvrage', id: ouvrage, point: { x: 0, y: 0 } } as Parameters<typeof dernier.intention>[0]));
    expect(dernier.choix).toBeNull();
    fireEvent.click(within(screen.getByRole('group', { name: 'Déplacer une arrivée' })).getAllByRole('button')[0]);
    expect(dernier.choix?.genre).toBe('arrivee');
    // Échap : plus de choix, les poignées des bouts reviennent.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dernier.choix).toBeNull();
    expect(screen.getByRole('group', { name: 'Déplacer une arrivée' })).toBeInTheDocument();
  });

  it('sans clavier, retoucher le lieu choisi sur sa terre le relâche, comme Échap : les poignées des bouts reviennent', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix?.genre).toBe('lieu');
    expect(screen.queryByRole('group', { name: 'Déplacer une arrivée' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix).toBeNull();
    expect(screen.getByRole('group', { name: 'Déplacer une arrivée' })).toBeInTheDocument();
    // Un autre lieu touché, lui, est choisi.
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    expect(dernier.choix?.genre === 'lieu' && dernier.choix.id).toBe(TOUR);
  });

  it('posé sur une place à l’icône de « Réunir », le lieu reste choisi et « Réunir » s’allume (choix 2a)', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    // La Tour, éloignée de la Ferme, puis rapprochée sur une place qui l'y colle.
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    const icone = dernier.vue!.reunions?.[0];
    expect(icone).toBeDefined();
    act(() => void dernier.intention({ genre: 'mer', point: { x: icone!.x, y: icone!.y } }));
    expect(screen.getByRole('button', { name: 'Poser' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(dernier.choix?.genre).toBe('lieu');
    expect(screen.getByRole('button', { name: 'Réunir' })).toBeEnabled();
  });

  it('« Valider » sur une place prise : le choix reste à sa place d’avant, rien de posé ne se perd', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    // Le coin libre du fond, à l'ouest : le coin de devant porte le Hangar des inventions depuis SC-2.
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 120 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
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

  it('le geste de la pose dure 1,5 s au plus, et un toucher le termine', () => {
    vi.useFakeTimers();
    render(<SettingsProvider><Banc reduit={false} depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    // Le coin libre du fond, à l'ouest : le coin de devant porte le Hangar des inventions depuis SC-2.
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 120 } }));
    const avant = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
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
    act(() => void dernier.intention({ genre: 'mer', point: { x: 190, y: 140 } }));
    const ici = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    act(() => void dernier.finirLeGeste());
    expect(dernier.geste).toBeNull();
    expect(spotOf(monde, VOLCAN)).not.toEqual(ici);
  });

  it('la pastille montre les liaisons à reposer ; le mot est expliqué la première fois ; on la repose', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 200, y: 200 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
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
  it('« Réunir » : sa place réservée dès qu’un lieu est choisi, éteint sans voisin, allumé près de la Tour ; la paire réunie, ↶ la défait', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const reunir = () => screen.getByRole('button', { name: 'Réunir' });
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(reunir()).toBeDisabled();
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    expect(reunir()).toBeEnabled();
    // Dans la barre du bas, entre « Poser » et « Annuler » (intention du directeur artistique, 6 octobre 2026).
    expect(reunir().closest('.arrange-bar')).not.toBeNull();
    const ordre = Array.from(document.querySelectorAll('.arrange-bar button')).map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim());
    expect(ordre.indexOf('Réunir')).toBe(ordre.indexOf('Poser') + 1);
    expect(ordre.indexOf('Annuler')).toBe(ordre.indexOf('Réunir') + 1);
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
    // Pendant la question, rien n'est mis en avant dans la barre, et « Poser » attend.
    expect(screen.getByRole('button', { name: 'Poser' })).toBeDisabled();
    expect(document.querySelectorAll('.arrange-bar .primary')).toHaveLength(0);
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
    // « Défaire » : l'icône, nommée ; son mot est là pour le grand texte.
    expect(screen.getByRole('button', { name: 'Défaire la dernière pose' })).toHaveTextContent('Défaire');
    fireEvent.click(screen.getByRole('button', { name: 'Défaire la dernière pose' }));
    expect(joinedWith(monde, TOUR)).toBeNull();
  });

  it('au téléphone : ↶ et « Poser », puis « Annuler » et « Valider » avec leur mot ; les flèches autour du choix, en icônes nommées ; la même ligne de signes', () => {
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
      expect(barre.querySelector('.arrange-bar-outils .arrange-pose')).not.toBeNull();
      expect(screen.queryByRole('button', { name: 'Tout remettre comme avant' })).toBeNull();
      expect(screen.queryByRole('button', { name: /Terminé/ })).toBeNull();
      expect(screen.getByRole('button', { name: 'Défaire la dernière pose' })).toHaveClass('bouton-icone');
      // La ligne : la même qu'à la tablette, des signes, dits en entier.
      act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
      // Les flèches sont dessinées dans le monde : leurs boutons, transparents, n'ont rien à lire, seulement leur nom.
      const nord = screen.getByRole('button', { name: 'Nord' });
      expect(nord.textContent).toBe('');
      expect(nord.closest('.arrange-bar')).toBeNull();
      expect(document.querySelector('.arrange-signes .signes-de-place')).not.toBeNull();
      expect(screen.getByRole('status').textContent).toBe(dernier.phrase);
      expect(dernier.phrase).toMatch(/^(Au [a-z-]+|À l’[a-z-]+) (de la |du |de l’)[^,]+, à \d+ cases?\.$/);
    } finally {
      window.matchMedia = avant;
    }
  });
});
