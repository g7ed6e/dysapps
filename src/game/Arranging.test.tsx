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
import { type Amenagement, useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeSentence } from './ArrangeBar';
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

function Banc({ reduit, depart, dire = () => {} }: { reduit: boolean; depart: World; dire?: (texte: string) => void }) {
  const [world, setWorld] = useState<World>(depart);
  monde = world;
  const a = useAmenagement({
    world,
    a: '6e',
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
    expect(screen.getByRole('status').textContent).toMatch(/^Le Gardien du /);
    fireEvent.click(screen.getByRole('button', { name: /Tourner/ }));
    // Plus de « C’est posé » : la ligne dit où il regarde, le son de la pose suffit.
    expect(screen.getByRole('status').textContent).not.toMatch(/C’est posé/);
    expect(screen.getByRole('status').textContent).not.toBe('');
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
    expect(screen.getByRole('status').textContent).toMatch(/^(Au|À l’) [a-z-]+ (de la |du |de l’)[^,]+, à \d+ cases?\.$/);
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
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    expect(dernier.ouvert).toBe(false);
  });

  it('« Valider » garde le plan ; Échap annule ; sans changement, « Annuler » ferme sans rien dire', () => {
    const dit: string[] = [];
    render(<SettingsProvider><Banc reduit depart={depart()} dire={(t) => dit.push(t)} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    const posee = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(dernier.ouvert).toBe(false);
    expect(spotOf(monde, VOLCAN)).toEqual(posee);
    // Échap : comme « Annuler ».
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 190, y: 140 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Poser' }));
    expect(spotOf(monde, VOLCAN)).not.toEqual(posee);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dernier.ouvert).toBe(false);
    expect(spotOf(monde, VOLCAN)).toEqual(posee);
    expect(dit.at(-1)).toBe('Le plan est remis comme avant.');
    // Rien de changé : « Annuler » ferme, sans rien dire.
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const avant = dit.length;
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(dernier.ouvert).toBe(false);
    expect(dit.slice(avant).filter((t) => /remis/.test(t))).toHaveLength(0);
  });

  it('le geste de la pose dure 1,5 s au plus, et un toucher le termine', () => {
    vi.useFakeTimers();
    render(<SettingsProvider><Banc reduit={false} depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
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
  it('« Réunir » : absent sans voisin, près de la Tour à sa place ; la paire réunie, ↶ la défait', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le plan' }));
    const reunir = () => screen.getByRole('button', { name: 'Réunir' });
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(screen.queryByRole('button', { name: 'Réunir' })).toBeNull();
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    // Près du choix, avec les flèches, pas dans la barre.
    expect(reunir().closest('.arrange-handles')).not.toBeNull();
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
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
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
      // Les flèches autour du choix : des icônes nommées pour l'accessibilité, leur mot réservé au grand texte.
      const nord = screen.getByRole('button', { name: 'Nord' });
      expect(nord.querySelector('.mot-sous-icone')?.textContent).toBe('Nord');
      expect(nord.closest('.arrange-bar')).toBeNull();
      expect(document.querySelector('.arrange-signes .signes-de-place')).not.toBeNull();
      expect(screen.getByRole('status').textContent).toBe(dernier.phrase);
      expect(dernier.phrase).toMatch(/^(Au|À l’) [a-z-]+ (de la |du |de l’)[^,]+, à \d+ cases?\.$/);
    } finally {
      window.matchMedia = avant;
    }
  });
});
