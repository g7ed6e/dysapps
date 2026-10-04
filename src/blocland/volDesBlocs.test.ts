// Les blocs qui volent jusqu'au compteur (proposition P2, PR 2, Blocland) : combien, combien de temps, quand le vol a
// lieu et quand non, le chiffre de la pastille et son nom lu ; le gain retenu à l'écran de fin, pris une fois.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VOL, blocsDuVol, chiffreDeLaPastille, dureeDuVol, nomDuBoutonBlocs, oublierLesBlocs, prendreLesBlocs, retenirLesBlocs, volALieu, type CeQuiEmpeche } from './volDesBlocs';

const RIEN: CeQuiEmpeche = { moinsDAnimations: false, autreUnivers: false, ficheOuverte: false, tutoriel: false, motQuiAttend: false, voyage: false, pleinEcran: false };

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
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5 });
  expect(prendreLesBlocs('french-6e-phonology')).toEqual({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5 });
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5 });
  expect(prendreLesBlocs('maths-6e-calculation')).toBeNull();
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 0 });
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
  sessionStorage.setItem('dysapps:blocs-gagnes', '{abîmé');
  expect(prendreLesBlocs('french-6e-phonology')).toBeNull();
});

describe('le dessin, dans blocland.css', () => {
  const css = readFileSync(join(process.cwd(), 'src/styles/blocland.css'), 'utf8');
  const regle = (selecteur: string) => css.match(new RegExp(`${selecteur.replace(/[.[\]()*+?^$|"]/g, '\\$&')} \\{[^}]*\\}`))?.[0] ?? '';

  it('la pastille : l’or, un carré aux coins de 4 px, 18 px au moins, jamais rouge', () => {
    const p = regle(':root[data-univers="blocland"] .world-bar-count');
    expect(p).toMatch(/background: #e0b73f/);
    expect(p).toMatch(/border-radius: 4px/);
    expect(p).toMatch(/font-size: 18px/);
    expect(p).toMatch(/min-height: 26px/);
    expect(p).not.toMatch(/red|#f00|#c00|var\(--error\)/i);
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

  it('les mots de la barre ne reviennent jamais, grand texte compris : le nom reste lu', () => {
    const r = regle(':root[data-univers="blocland"] .world-bar .world-bar-text');
    expect(r).toMatch(/clip-path: inset\(50%\)/);
    expect(css).not.toMatch(/data-texte="grand"\][^{]*\.world-bar-text/);
  });

  it('le bouton de l’île en herbe, l’action principale de la barre ; le bouton ouvert en or et enfoncé', () => {
    expect(regle(':root[data-univers="blocland"] .world-bar .world-bar-ile')).toMatch(/--button-bg: var\(--primary-bg\)/);
    const ouvert = regle(':root[data-univers="blocland"] .world-bar .button[aria-pressed="true"]');
    expect(ouvert).toMatch(/transform: translateY\(var\(--press\)\)/);
    expect(ouvert).toMatch(/--face-pressed/);
  });
});
