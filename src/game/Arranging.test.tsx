// Le mode « Aménager » à l'écran (GD-9, point 1) : choisir un lieu, toucher la mer (le fantôme se cale), les flèches
// jusqu'à « Plus de place par là », « Poser ici » (avec son geste, qu'un toucher termine ; d'un coup avec moins
// d'animations), ↶ et « Remettre comme avant » ; la barre ne met en avant qu'un bouton ; la pastille des liaisons à
// reposer, et le mot expliqué la première fois.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { SettingsProvider } from '../core/SettingsContext';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { World } from './engine/state';
import { type Amenagement, useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeSentence, briefSummary } from './ArrangeBar';
import { HABILLAGES } from './world/skin';
import { toutConstruit } from './world/budget';
import { joinedWith, linksToRelink, NO_MORE_ROOM, spotOf } from './world/arrange';
import { GESTE_DU_LIEU } from './world/arrangeGesture';
import { applyLayout } from './world/appliedLayout';
import { thePlace, toPlace } from './world/placeArticle';

vi.mock('./sound', async (original) => ({ ...(await original<typeof import('./sound')>()), playClac: vi.fn(), playPlace: vi.fn() }));

const VOLCAN = 'maths-6e-decimals' as const;
const TOUR = 'french-6e-reading' as const;
const FERME = 'french-6e-grammar-spelling' as const;
// Les noms du jeu pour la Tour et la Ferme (deux noms féminins, pour l'accord de « réunie ») ; l'identifiant pour les autres.
const NOMS: Record<string, string> = { [TOUR]: 'Tour du lecteur', [FERME]: 'Ferme des accords' };
const nom = (id: string) => NOMS[id] ?? id;

let dernier: Amenagement;
let monde: World;

function Banc({ reduit, depart }: { reduit: boolean; depart: World }) {
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
    dire: () => {},
    versMonde: (p) => ({ x: p.local.x, y: p.local.y, z: p.local.z }),
    // Le plus haut cube de chaque lieu : 7 cases au-dessus du sol.
    hautDuLieu: () => 7,
  });
  dernier = a;
  return (
    <>
      <ArrangeButton amenagement={a} />
      <ArrangeSentence amenagement={a} nom={nom} />
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
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    act(() => void dernier.intention({ genre: 'creature', id: VOLCAN, gardien: true }));
    expect(screen.getByRole('status').textContent).toMatch(/^Le Gardien du /);
    fireEvent.click(screen.getByRole('button', { name: /Tourner/ }));
    expect(screen.getByRole('status').textContent).toMatch(/^C’est posé\. /);
  });

  it('choisir, caler, décaler, poser d’un coup (moins d’animations), défaire et remettre comme avant', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    expect(screen.getByRole('status').textContent).toMatch(/Touche un lieu/);
    // Rien de choisi : ✓ Terminé est mis en avant, « Poser ici » éteint.
    expect(screen.getByRole('button', { name: /Terminé/ }).className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: /Poser ici/ })).toBeDisabled();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(dernier.choix?.genre).toBe('lieu');
    expect(screen.getByRole('button', { name: /Poser ici/ }).className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: /Terminé/ }).className).not.toMatch(/primary/);
    expect(dernier.vue?.cases.length).toBeGreaterThan(0);
    // Le nom du lieu choisi se pose sur son fantôme.
    expect(dernier.vue?.nom).toBe(VOLCAN);
    // « Poser ici » et « Terminé » n'ont pas la même icône (la coche reste à « Terminé »).
    const icone = (n: RegExp) => screen.getByRole('button', { name: n }).querySelector('svg')?.getAttribute('class');
    expect(icone(/Poser ici/)).not.toBe(icone(/Terminé/));
    // La mer touchée : le fantôme se cale, la phrase dit où.
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    expect(screen.getByRole('status').textContent).toMatch(new RegExp(`^${VOLCAN} : .+, à \\d+ cases?\\.`));
    // Les flèches, jusqu'au bord : « Plus de place par là ».
    for (let i = 0; i < 60 && !screen.getByRole('status').textContent?.includes(NO_MORE_ROOM); i++) fireEvent.click(screen.getByRole('button', { name: /Ouest/ }));
    expect(screen.getByRole('status').textContent).toBe(NO_MORE_ROOM);
    const avant = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    expect(screen.getByRole('status').textContent).toMatch(/^C’est posé\./);
    // ↶ défait la pose.
    fireEvent.click(screen.getByRole('button', { name: 'Défaire la dernière pose' }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    // Une autre pose, puis « Remettre comme avant ».
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    fireEvent.click(screen.getByRole('button', { name: /Remettre comme avant/ }));
    expect(spotOf(monde, VOLCAN)).toEqual(avant);
    fireEvent.click(screen.getByRole('button', { name: /Terminé/ }));
    expect(dernier.ouvert).toBe(false);
  });

  it('le geste de la pose dure 1,5 s au plus, et un toucher le termine', () => {
    vi.useFakeTimers();
    render(<SettingsProvider><Banc reduit={false} depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 0, y: 0 } }));
    const avant = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    expect(dernier.geste?.phase).toBe('demonte');
    // Le lieu qui se déplace reste « Choisi » le temps du geste (son étiquette ne revient pas à son état).
    expect(dernier.choix).toBeNull();
    expect(dernier.lieuDuGeste).toBe(VOLCAN);
    // Le démontage part du plus haut cube du lieu, pas du vide au-dessus ; le voile d'Archipéo sait où il va.
    expect(dernier.geste?.haut).toBe(8);
    expect(dernier.geste?.autre).toBeDefined();
    expect(GESTE_DU_LIEU.demonteMs + GESTE_DU_LIEU.remonteMs).toBeLessThanOrEqual(1500);
    act(() => void vi.advanceTimersByTime(GESTE_DU_LIEU.demonteMs));
    expect(dernier.geste?.phase).toBe('remonte');
    expect(spotOf(monde, VOLCAN)).not.toEqual(avant);
    act(() => void vi.advanceTimersByTime(GESTE_DU_LIEU.remonteMs));
    expect(dernier.geste).toBeNull();
    expect(dernier.lieuDuGeste).toBeNull();
    // Une autre pose : un toucher pendant le démontage pose tout de suite.
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 190, y: 140 } }));
    const ici = spotOf(monde, VOLCAN);
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    act(() => void dernier.finirLeGeste());
    expect(dernier.geste).toBeNull();
    expect(spotOf(monde, VOLCAN)).not.toEqual(ici);
  });

  it('la pastille montre les liaisons à reposer ; le mot est expliqué la première fois ; on la repose', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    act(() => void dernier.intention({ genre: 'mer', point: { x: 200, y: 200 } }));
    fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
    const n = linksToRelink(monde, '6e').length;
    expect(n).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Terminé/ }));
    // Le bouton dit le nombre, en mots et dans la pastille (icône et nombre).
    const bouton = screen.getByRole('button', { name: new RegExp(`Aménager \\(${n} liaisons? à reposer\\)`) });
    expect(bouton.querySelector('.arrange-count')?.textContent).toBe(String(n));
    fireEvent.click(bouton);
    expect(screen.getByRole('dialog', { name: 'Liaisons à reposer' }).textContent).toMatch(/Une liaison à reposer, c’est/);
    fireEvent.click(screen.getAllByRole('button', { name: /^Entre / })[0]);
    expect(dernier.choix?.genre).toBe('liaison');
    if (dernier.choix?.genre === 'liaison' && dernier.choix.to) {
      fireEvent.click(screen.getByRole('button', { name: /Poser ici/ }));
      expect(linksToRelink(monde, '6e').length).toBe(n - 1);
    }
    // La deuxième fois, le mot n'est plus expliqué.
    fireEvent.click(screen.getByRole('button', { name: /Terminé/ }));
    if (linksToRelink(monde, '6e').length) {
      fireEvent.click(screen.getByRole('button', { name: /Aménager \(/ }));
      expect(screen.getByRole('dialog').textContent).not.toMatch(/Une liaison à reposer, c’est/);
    }
  });
  it('« Réunir » : éteint sans voisin, allumé pour la Tour à sa place ; la paire réunie, ↶ la défait', () => {
    render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
    const reunir = () => screen.getByRole('button', { name: 'Réunir' });
    expect(reunir()).toBeDisabled();
    act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
    expect(reunir()).toBeDisabled();
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    expect(reunir()).toBeEnabled();
    expect(reunir().className).not.toMatch(/primary/);
    expect(screen.getByRole('status').textContent).toMatch(new RegExp(`Il peut se réunir ${toPlace(nom(FERME))}`));
    // « Réunir » pose la question (un bouton par voisin, « Ne pas réunir ») : rien ne se fait avant la réponse.
    fireEvent.click(reunir());
    expect(joinedWith(monde, TOUR)).toBeNull();
    const question = screen.getByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` });
    expect(question.textContent).toMatch(new RegExp(`Réunir ${thePlace(nom(TOUR))} et ${thePlace(nom(FERME))}\u00a0\\? Les deux lieux ne se sépareront plus\\.`));
    // Pendant la question, rien n'est mis en avant dans la barre, et « Poser ici » attend.
    expect(screen.getByRole('button', { name: /Poser ici/ })).toBeDisabled();
    expect(document.querySelectorAll('.arrange-bar .primary')).toHaveLength(0);
    // La première fois, une phrase sur la construction de l'univers, sans redire qu'ils ne se sépareront plus.
    expect(question.querySelector('.arrange-explication')!.textContent).toBe('On la bâtit bloc par bloc, comme une grande construction.');
    expect(question.textContent!.match(/ne se sépar/g)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^Ne pas réunir/ }));
    expect(joinedWith(monde, TOUR)).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Rien n’est réuni.');
    act(() => void dernier.intention({ genre: 'ile', id: TOUR }));
    fireEvent.click(reunir());
    // La deuxième fois, le mot n'est plus expliqué.
    expect(screen.getByRole('group', { name: `Réunir ${thePlace(nom(TOUR))} ?` }).querySelector('.arrange-explication')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `Réunir avec ${thePlace(nom(FERME))}` }));
    expect(joinedWith(monde, TOUR)).toBe(FERME);
    const apres = screen.getByRole('status').textContent!;
    // Des phrases courtes, une idée chacune, sans symbole.
    // « réuni » s'accorde avec le premier lieu : la Tour et la Ferme, deux noms féminins.
    expect(apres.startsWith('La Tour du lecteur est réunie à la Ferme des accords. Les deux lieux bougent ensemble. ')).toBe(true);
    expect(apres).toMatch(/^.+ est réunie? (à la|au|à l’) .+\. Les deux lieux bougent ensemble\. (Un ouvrage est à reposer\. |Une liaison est à reposer\. )?La construction qui les réunit se construit depuis le panneau de l’île\. Défaire annule la réunion\.$/);
    expect(apres).not.toMatch(/[↶✓]/);
    // « Défaire » : l'icône et le mot, toujours écrits.
    expect(screen.getByRole('button', { name: 'Défaire la dernière pose' })).toHaveTextContent('Défaire');
    fireEvent.click(screen.getByRole('button', { name: 'Défaire la dernière pose' }));
    expect(joinedWith(monde, TOUR)).toBeNull();
  });

  it('au téléphone : la rangée fixe « Poser ici » et Terminé, la croix d’icônes nommées, « Plus » pour le reste, la phrase en une ligne qui s’ouvre', () => {
    const avant = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('max-width'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
    try {
      render(<SettingsProvider><Banc reduit depart={depart()} /></SettingsProvider>);
      fireEvent.click(screen.getByRole('button', { name: 'Aménager' }));
      const barre = document.querySelector('.arrange-bar')!;
      // La rangée fixe, hors de la partie qui défile.
      const fin = barre.querySelector('.arrange-bar-fin')!;
      expect(fin.textContent).toMatch(/Poser ici/);
      expect(fin.textContent).toMatch(/Terminé/);
      expect(barre.querySelector('.arrange-bar-outils .arrange-pose')).toBeNull();
      // Les flèches : des icônes nommées pour l'accessibilité, sans mot écrit au téléphone.
      const nord = screen.getByRole('button', { name: 'Nord' });
      expect(nord.textContent).toBe('');
      // « Tourner », « Réunir », « Défaire », « Remettre comme avant » dans le pli « Plus ».
      expect(screen.queryByRole('button', { name: /Tourner/ })).toBeNull();
      const plus = screen.getByRole('button', { name: /Plus/ });
      expect(plus).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(plus);
      expect(plus).toHaveAttribute('aria-expanded', 'true');
      for (const n of [/Tourner/, /^Réunir$/, /Défaire/, /Remettre comme avant/]) expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
      // La phrase : la direction et l'écart, sans le nom (sur l'étiquette « Choisi ») ni « … » ; la phrase entière au toucher.
      act(() => void dernier.intention({ genre: 'ile', id: VOLCAN }));
      const ligne = document.querySelector('.arrange-line-texte') as HTMLButtonElement;
      expect(ligne.textContent).toMatch(/^(Au|À l’) [a-z-]+ (de la|du|de l’) [^,]+, à \d+ cases?\.$/);
      expect(ligne.textContent).not.toMatch(/…/);
      // Sur plus de deux lignes (texte agrandi), la ligne courte dit la direction et l'écart sans le voisin.
      expect(briefSummary('Au nord-ouest de la Mine des lettres, à 4 cases.')).toBe('Au nord-ouest, à 4 cases.');
      expect(briefSummary('Posé à l’est du Volcan des décimaux, à 1 case.')).toBe('Posé à l’est, à 1 case.');
      expect(briefSummary('Au sud de l’Horloge des verbes, à 2 cases.')).toBe('Au sud, à 2 cases.');
      expect(briefSummary('La borne : place 2 sur 4')).toBe('La borne : place 2 sur 4');
      // La zone annoncée est hors du bouton : l'ouvrir ne fait pas relire la phrase.
      expect(ligne.closest('[role="status"]')).toBeNull();
      expect(screen.getByRole('status').textContent).toBe(dernier.phrase);
      fireEvent.click(ligne);
      expect(ligne).toHaveAttribute('aria-expanded', 'true');
      expect(ligne.textContent).toBe(dernier.phrase);
      expect(ligne.textContent).toMatch(/, à \d+ cases?\./);
    } finally {
      window.matchMedia = avant;
    }
  });
});
