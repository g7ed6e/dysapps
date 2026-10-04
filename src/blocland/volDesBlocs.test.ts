// Les blocs qui volent jusqu'au compteur (proposition P2, PR 2, Blocland) : combien, combien de temps, quand le vol a
// lieu et quand non, le chiffre de la pastille et son nom lu ; le gain retenu à l'écran de fin, pris une fois.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VOL, blocsDuVol, chiffreDeLaPastille, dureeDuVol, nomDuBoutonBlocs, oublierLesBlocs, prendreLesBlocs, retenirLesBlocs, volALieu, type CeQuiEmpeche } from './volDesBlocs';

const RIEN: CeQuiEmpeche = { moinsDAnimations: false, ficheOuverte: false, tutoriel: false, motQuiAttend: false, voyage: false, pleinEcran: false };

beforeEach(() => oublierLesBlocs());

it('trois blocs au plus, quel que soit le gain ; 0,6 s chacun, départs à 0,1 s : 0,8 s en tout', () => {
  expect([0, 1, 2, 3, 12, 400].map(blocsDuVol)).toEqual([0, 1, 2, 3, 3, 3]);
  expect(VOL.trajetMs).toBe(600);
  expect(VOL.ecartMs).toBe(100);
  expect(dureeDuVol(12)).toBe(800);
  expect(dureeDuVol(1)).toBe(600);
  expect(dureeDuVol(0)).toBe(0);
});

it('le vol a lieu avec des blocs gagnés, et rien à l’écran qu’il couvrirait', () => {
  expect(volALieu({ nombre: 5 }, RIEN)).toBe(true);
  expect(volALieu(null, RIEN)).toBe(false);
  expect(volALieu({ nombre: 0 }, RIEN)).toBe(false);
  for (const cle of Object.keys(RIEN) as (keyof CeQuiEmpeche)[]) expect(volALieu({ nombre: 5 }, { ...RIEN, [cle]: true })).toBe(false);
});

it('rien avec « Réduire les animations » : pas de vol, le chiffre change', () => {
  expect(volALieu({ nombre: 5 }, { ...RIEN, moinsDAnimations: true })).toBe(false);
  expect(chiffreDeLaPastille(9, null)).toBe(9);
});

it('la pastille garde l’ancien chiffre pendant le vol, jamais en dessous de 0 ; « 0 » s’affiche', () => {
  expect(chiffreDeLaPastille(9, 5)).toBe(4);
  expect(chiffreDeLaPastille(3, 5)).toBe(0);
  expect(chiffreDeLaPastille(0, null)).toBe(0);
});

it('le nom lu dit le nombre : « Mes blocs, 12 »', () => {
  expect(nomDuBoutonBlocs(12)).toBe('Mes blocs, 12');
  expect(nomDuBoutonBlocs(0)).toBe('Mes blocs, 0');
});

it('le gain retenu se prend une fois, sur son île ; ailleurs il est oublié ; sans gain, rien n’est retenu', () => {
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: 1000 });
  expect(prendreLesBlocs('french-6e-phonology', 2000)).toEqual({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: 1000 });
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: Date.now() });
  expect(prendreLesBlocs('maths-6e-calculation')).toBeNull();
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 0, quand: Date.now() });
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  sessionStorage.setItem('dysapps:blocs-gagnes', '{abîmé');
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
});

it('un gain retenu il y a plus d’une minute ne se montre plus (retour tardif sur l’île)', () => {
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: 1000 });
  expect(prendreLesBlocs('french-6e-phonology', 1000 + VOL.gardeMs + 1)).toBeNull();
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: 1000 });
  expect(prendreLesBlocs('french-6e-phonology', 1000 + VOL.gardeMs)).not.toBeNull();
});

describe('le dessin, dans blocland.css', () => {
  const css = readFileSync(join(process.cwd(), 'src/styles/blocland.css'), 'utf8');
  const regle = (selecteur: string) => css.match(new RegExp(`${selecteur.replace(/[.[\]()*+?^$|"]/g, '\\$&')} \\{[^}]*\\}`))?.[0] ?? '';

  const global = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
  // Toutes les règles de global.css à ce sélecteur exact, mises bout à bout (la structure, puis l'habillage d'Archipéo).
  const regleCommune = (selecteur: string) =>
    [...global.matchAll(new RegExp(`(?:^|\\n)${selecteur.replace(/[.[\]()*+?^$|"]/g, '\\$&')} \\{[^}]*\\}`, 'g'))].map((m) => m[0]).join('');

  it('la pastille : sa place commune (global.css), l’or, un carré aux coins de 4 px, 18 px au moins, jamais rouge', () => {
    const commune = regleCommune('.world-bar-count');
    expect(commune).toMatch(/position: absolute/);
    expect(commune).toMatch(/font-size: 18px/);
    expect(commune).toMatch(/min-height: 26px/);
    const p = regle(':root[data-univers="blocland"] .world-bar-count');
    expect(p).toMatch(/background: #e0b73f/);
    expect(p).toMatch(/border-radius: 4px/);
    expect(`${commune}${p}`).not.toMatch(/red|#f00|#c00|var\(--error\)/i);
    // Plus de parenthèses autour du nombre (l'ancien compte d'Archipéo) : une pastille dans les deux univers.
    expect(global).not.toMatch(/\.world-bar-count::(before|after)/);
  });

  it('bord de 3 px, bande claire de 4 px, sauf en thème Clair, entièrement plat', () => {
    expect(css).toMatch(/--bord: 3px;/);
    expect(css).toMatch(/--bande-h: 4px;/);
    expect(regle(':root[data-univers="blocland"][data-theme="light"]')).toMatch(/--bande-h: 0px;/);
  });

  it('les réponses d’un exercice ne rebondissent pas ; l’appui reste instantané', () => {
    expect(regle(':root[data-univers="blocland"] .option')).toMatch(/transition: none/);
    expect(css).toMatch(/:root\[data-univers="blocland"\] button\.island-quest:active:not\(:disabled\) \{[^}]*transition: none/);
  });

  it('les icônes seules, le nom lu ; en grand texte, le mot sous l’icône, dans les deux univers (« 2a », « 4a »)', () => {
    const bouton = regleCommune('.world-bar .button');
    expect(bouton).toMatch(/width: 56px/);
    expect(bouton).toMatch(/height: 56px/);
    expect(regleCommune('.world-bar .button svg')).toMatch(/width: 32px/);
    expect(regleCommune('.world-bar')).toMatch(/gap: 8px/);
    expect(regleCommune('.world-bar .world-bar-text')).toMatch(/clip-path: inset\(50%\)/);
    const mot = regleCommune(':root[data-texte="grand"] .world-bar .world-bar-text');
    expect(mot).toMatch(/clip-path: none/);
    expect(mot).toMatch(/position: static/);
    expect(mot).toMatch(/font-size: min\(1rem, 24px\)/);
    expect(regleCommune(':root[data-texte="grand"] .world-bar .button')).toMatch(/flex-direction: column/);
    expect(regleCommune(':root[data-texte="grand"] .world-bar')).toMatch(/align-items: flex-end/);
    // La structure n'est plus réservée à Blocland : blocland.css n'y garde que sa matière.
    expect(css).not.toMatch(/\.world-bar-text/);
    expect(css).not.toMatch(/\.world-bar \.button svg/);
  });

  it('Archipéo : le bouton ouvert descend et son ombre se réduit (pas la couleur seule) ; l’île dans la couleur d’action', () => {
    expect(regleCommune('.world-bar .button')).toMatch(/box-shadow: 0 3px 0/);
    const ouvert = global.match(/\n\.world-bar \.button:active,\n\.world-bar \.button\[aria-pressed="true"\] \{[^}]*\}/)?.[0] ?? '';
    expect(ouvert).toMatch(/transform: translateY\(2px\)/);
    expect(ouvert).toMatch(/box-shadow: 0 1px 0/);
    expect(regleCommune('.world-bar .world-bar-ile')).toMatch(/--button-bg: var\(--primary-bg\)/);
  });

  it('le bouton de l’île en herbe, l’action principale de la barre ; le bouton ouvert en or et enfoncé', () => {
    expect(regle(':root[data-univers="blocland"] .world-bar .world-bar-ile')).toMatch(/--button-bg: var\(--primary-bg\)/);
    const ouvert = regle(':root[data-univers="blocland"] .world-bar .button[aria-pressed="true"]');
    expect(ouvert).toMatch(/transform: translateY\(var\(--press\)\)/);
    expect(ouvert).toMatch(/--face-pressed/);
  });
});
