// La créature qui se souvient (GD-4, étape 1) : elle fait signe seulement quand une mission de son île a des questions
// à revoir aujourd'hui ; à l'arrivée sur son île, elle propose « Reprendre » (les révisions de l'île, puis l'île) et
// « Plus tard », qui la fait taire jusqu'à la visite suivante ; la vue simple montre l'icône sur la Carte.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { getBiome, type BiomeId } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { addDays, todayISO, type SpacedItem } from './engine';
import { CATALOG } from './exercises';
import { IslandSheet } from './IslandSheet';
import { BloclandPage } from './BloclandPage';
import { BiomePage } from './BiomePage';
import { PLUS_TARD_DIT, ResidentReminder, phraseDuRappel, titrePourLaVoix } from './ResidentReminder';
import { textesDe } from '../universes';
import { cheminDeRevision, creaturesQuiFontSigne, oublierLesRemises, remettreAPlusTard, remisesAPlusTard, revisionsDeLIle } from './reminders';
import { BRIDGES } from './world/archipelago';

const FORET: BiomeId = 'french-6e-phonology';
const SYLLABES = CATALOG.find((e) => e.biome === FORET && e.type === 'syllables')!;
const aujourdhui = todayISO();
const due = (exerciseId: string, jour = aujourdhui): SpacedItem => ({ itemId: `${exerciseId}:cabane`, due: jour, stage: 0, streak: 0 });
/** Tous les ouvrages : toutes les îles sont ouvertes. */
const TOUT_OUVERT = BRIDGES.map((b) => b.id);

beforeEach(() => oublierLesRemises());

describe('qui fait signe', () => {
  it('seulement la créature dont l’île a des questions à revoir aujourd’hui, avec l’icône de la notion de l’île', () => {
    expect(creaturesQuiFontSigne([], TOUT_OUVERT, '6e', new Set())).toEqual([]);
    // Dues demain : rien aujourd'hui.
    expect(creaturesQuiFontSigne([due(SYLLABES.id, addDays(aujourdhui, 1))], TOUT_OUVERT, '6e', new Set())).toEqual([]);
    // Dues aujourd'hui (ou en retard) : la créature de la Forêt, seule.
    expect(creaturesQuiFontSigne([due(SYLLABES.id)], TOUT_OUVERT, '6e', new Set())).toEqual([{ id: FORET, icone: getBiome(FORET)!.icon }]);
    expect(creaturesQuiFontSigne([due(SYLLABES.id, addDays(aujourdhui, -3))], TOUT_OUVERT, '6e', new Set())).toHaveLength(1);
    // Une autre classe : pas dans cet archipel.
    expect(creaturesQuiFontSigne([due(SYLLABES.id)], TOUT_OUVERT, '5e', new Set())).toEqual([]);
    // Après « Plus tard » : plus de signe pendant la visite.
    expect(creaturesQuiFontSigne([due(SYLLABES.id)], TOUT_OUVERT, '6e', new Set([FORET]))).toEqual([]);
  });

  it('les révisions de l’île : une par mission, sur l’île seule, avec l’adresse qui revient sur l’île', () => {
    const autre = CATALOG.find((e) => e.biome !== FORET && e.biome.endsWith('6e-calculation'))!;
    const dues = revisionsDeLIle([due(SYLLABES.id), due(autre.id)], TOUT_OUVERT, FORET);
    expect(dues.map((q) => q.biome)).toEqual([FORET]);
    expect(cheminDeRevision(dues[0])).toBe(`/adventure/${FORET}/syllables?revision=1`);
  });
});

describe('« Plus tard »', () => {
  it('est retenu pour la visite, sans toucher à la sauvegarde', () => {
    expect(remisesAPlusTard().has(FORET)).toBe(false);
    remettreAPlusTard(FORET);
    expect(remisesAPlusTard().has(FORET)).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('dysapps:revisions-plus-tard')!)).toEqual([FORET]);
    expect(localStorage.getItem('dysapps:game')).toBeNull();
  });
});

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

/** La voix, sans navigateur : ce qu'elle dit, dans l'ordre. */
function voix(): string[] {
  const dit: string[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    lang = '';
    rate = 1;
    voice: unknown = null;
    constructor(public text: string) {}
  });
  vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => dit.push(u.text) });
  return dit;
}

const sauver = (spaced: SpacedItem[]) =>
  localStorage.setItem('dysapps:game', JSON.stringify({ spaced, progress: { [SYLLABES.id]: { stars: 1, attempts: 1, best: 0.3 } } }));

describe('le panneau de l’île', () => {
  it('propose de reprendre, avec « Écouter », « Reprendre » vers les révisions de l’île et « Plus tard »', () => {
    // La voix : la phrase est lue à l'arrivée, après l'accueil, et se réécoute.
    const dit: string[] = [];
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    });
    vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => dit.push(u.text) });
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
    sauver([due(SYLLABES.id)]);
    render(
      <Providers>
        <IslandSheet biome={getBiome(FORET)!} onClose={() => {}} in3d />
      </Providers>,
    );
    const rappel = screen.getByRole('group', { name: /Mousso/ });
    expect(rappel).toHaveTextContent('Abattage syllabique');
    // Ni date, ni échec, ni blocs à gagner.
    expect(rappel.textContent).not.toMatch(/hier|raté|bloc|jour/i);
    expect(screen.getByRole('link', { name: /Reprendre/ })).toHaveAttribute('href', `/adventure/${FORET}/syllables?revision=1`);
    // Le même mot que le bouton de l'accueil, juste au-dessus.
    expect(screen.getByRole('button', { name: /Réécouter : J’ai gardé «\s?Abattage syllabique\s?» de côté/ })).toBeInTheDocument();
    expect(dit.at(-1)).toMatch(/Mousso|forêt/i);
    expect(dit.at(-1)).toMatch(/On s’y remet ensemble\s?\?$/);
    expect(screen.getByRole('button', { name: 'Plus tard' })).toBeInTheDocument();
  });

  it('ne propose rien sans révision due', () => {
    sauver([due(SYLLABES.id, addDays(aujourdhui, 2))]);
    render(
      <Providers>
        <IslandSheet biome={getBiome(FORET)!} onClose={() => {}} in3d />
      </Providers>,
    );
    expect(screen.queryByRole('link', { name: /Reprendre/ })).not.toBeInTheDocument();
  });

  it('après « Plus tard », ne repropose rien pendant la visite, même en revenant sur l’île', async () => {
    sauver([due(SYLLABES.id)]);
    const ouvrir = () =>
      render(
        <Providers>
          <IslandSheet biome={getBiome(FORET)!} onClose={() => {}} in3d />
        </Providers>,
      );
    ouvrir();
    await userEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(screen.queryByRole('link', { name: /Reprendre/ })).not.toBeInTheDocument();
    // Le panneau refermé puis rouvert (une autre île, un exercice, la Carte) : toujours rien.
    cleanup();
    ouvrir();
    expect(screen.queryByRole('link', { name: /Reprendre/ })).not.toBeInTheDocument();
    // La visite suivante (un nouvel onglet, une nouvelle séance) : elle propose de nouveau.
    cleanup();
    oublierLesRemises();
    ouvrir();
    expect(screen.getByRole('link', { name: /Reprendre/ })).toBeInTheDocument();
  });

  it('après « Plus tard », le focus revient au titre de l’île, et une courte ligne le dit', async () => {
    sauver([due(SYLLABES.id)]);
    render(
      <Providers>
        <IslandSheet biome={getBiome(FORET)!} onClose={() => {}} in3d />
      </Providers>,
    );
    // La région qui le dit est là d'avance, vide.
    const dit = document.querySelector('.creature-rappel-remis')!;
    expect(dit).toHaveAttribute('role', 'status');
    expect(dit).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: /Forêt/ }));
    expect(document.activeElement).toHaveAttribute('tabindex', '-1');
    expect(dit).toHaveTextContent(PLUS_TARD_DIT);
  });
});

describe('la phrase de la créature', () => {
  const textes = textesDe('blocland');

  it('un « / » dans un titre n’est pas lu comme un symbole', () => {
    expect(titrePourLaVoix('Récolte -é / -er / -ez')).toBe('Récolte -é, -er, -ez');
    const r = phraseDuRappel(textes, 'Récolte -é / -er / -ez', undefined, '/x');
    expect(r.texte).toContain('Récolte -é / -er / -ez');
    expect(r.lu).toContain('Récolte -é, -er, -ez');
    expect(r.lu).not.toContain('/');
    expect(r.etranger).toBeNull();
  });

  it('un titre d’anglais ou de LV2 : écrit à part, dans sa langue ; la phrase lue ne le dit pas', () => {
    const r = phraseDuRappel(textes, 'For / since', 'en', '/x');
    expect(r.texte).toMatch(/J’ai gardé «\s?For \/ since\s?» de côté/);
    expect(r.lu).toMatch(/^J’ai gardé cette mission de côté\. On s’y remet ensemble\s?\?$/);
    expect(r.lu).not.toMatch(/For|since|«|»/);
    // La phrase commune (Archipéo) aussi.
    expect(phraseDuRappel(textesDe('archipeo'), 'Hola', 'es', '/x').lu).toMatch(/^On reprend cette mission ensemble\s?\?$/);
  });

  it('le titre étranger s’écrit sans syllabes colorées, avec sa langue', () => {
    localStorage.setItem('dysapps:settings', JSON.stringify({ syllables: true }));
    render(
      <Providers>
        <ResidentReminder biome={getBiome(FORET)!} rappel={phraseDuRappel(textes, 'For / since', 'en', '/x')} />
      </Providers>,
    );
    const titre = screen.getByText('For / since');
    expect(titre).toHaveAttribute('lang', 'en');
    expect(titre.closest('.syllables')).toBeNull();
    expect(titre.querySelector('.syl')).toBeNull();
    // Le reste de la phrase garde ses syllabes.
    expect(document.querySelector('.creature-rappel-texte .syl')).not.toBeNull();
  });
});

function pageDeLIle() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[`/adventure/${FORET}`]}>
            <Routes>
              <Route path="/adventure/:biomeId" element={<BiomePage />} />
            </Routes>
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

describe('la vue simple', () => {
  it('la phrase de la créature est lue après l’accueil, en une seule lecture', () => {
    const dit = voix();
    localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));
    sauver([due(SYLLABES.id)]);
    pageDeLIle();
    expect(dit).toHaveLength(1);
    expect(dit[0]).toMatch(/On s’y remet ensemble\s?\?$/);
    expect(dit[0].indexOf('J’ai gardé')).toBeGreaterThan(0);
  });

  it('après « Plus tard », le focus revient au titre de l’île, et une courte ligne le dit', async () => {
    sauver([due(SYLLABES.id)]);
    pageDeLIle();
    await userEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
    expect(document.querySelector('.creature-rappel-remis')).toHaveTextContent(PLUS_TARD_DIT);
  });

  it('le signe suit l’habillage : une plaque dans Blocland, un hexagone Brume au bord Nuit océan dans Archipéo', () => {
    const css = (f: string) => readFileSync(join(process.cwd(), 'src/styles', f), 'utf8');
    expect(css('global.css')).not.toMatch(/--radius-signe:\s*50%/);
    const hexagone = css('global.css').match(/:root\[data-univers="archipeo"\] :is\(\.creature-rappel-icone, \.biome-rappel\) \{[^}]*\}/)![0];
    expect(hexagone).toMatch(/mask: var\(--hexagone\)/);
    expect(hexagone).toMatch(/stroke-linejoin='round'/);
    expect(hexagone).toMatch(/background: #142b38/);
    expect(css('global.css')).toMatch(/:root\[data-univers="archipeo"\] :is\(\.creature-rappel-icone, \.biome-rappel\)::before \{[^}]*background: #e5ebe3/);
    expect(css('blocland.css')).toMatch(/--radius-signe:\s*4px/);
    for (const classe of ['creature-rappel-icone', 'biome-rappel']) {
      const regle = css('global.css').match(new RegExp(`\\.${classe} \\{[^}]*\\}`))![0];
      expect(regle).toContain('border-radius: var(--radius-signe)');
    }
  });

  it('montre l’icône de la notion sur l’île dans la Carte, et le toucher mène au même panneau', () => {
    sauver([due(SYLLABES.id)]);
    render(
      <Providers>
        <BloclandPage />
      </Providers>,
    );
    const carte = document.querySelector(`a.biome-${FORET}`)!;
    expect(carte.querySelector('.biome-rappel svg')).not.toBeNull();
    expect(carte).toHaveAttribute('href', `/adventure/${FORET}`);
    expect(document.querySelectorAll('.biome-rappel')).toHaveLength(1);
  });
});
