import { readFileSync } from 'node:fs';
import { BLOC, BLOCKS, BIOMES, blockCount, nomDuBloc } from '../biomes';
import { EMPTY_STATE, assembleBlock, disassembleBlock, fillPlanCell, planStatus, repondreAssemblage, sanitizeState } from '../engine';
import { retenirReglages } from '../../core/settings';
import { DEFAULT_SETTINGS } from '../../core/settings';
import { textesDe } from '../../univers';
import { ARCHIPELAGOS } from './archipelago';
import {
  QUESTIONS_SANS_REDITE,
  RECETTES,
  RETOUR_DE_LA_MANQUEE,
  assemblables,
  lireTirage,
  manquePour,
  noterQuestion,
  ordreDuTour,
  prochaineQuestion,
  recetteDe,
  tirageNeuf,
  type TirageAssemblage,
} from './assemblage';
import { ASSEMBLAGE } from './recettes';
import { UNIVERS_IDS } from '../../core/univers';
import { getMonument, monumentsOf } from './monuments';
import { planCells } from './plans';
import { allerChercher } from './uses';

afterEach(() => retenirReglages(null));

it('un bloc assemblé par archipel, fait de blocs de deux îles de son archipel, jamais d’or ni de cristal', () => {
  expect(RECETTES.map((r) => r.archipelago)).toEqual(ARCHIPELAGOS.map((a) => a.classe));
  for (const r of RECETTES) {
    expect(BLOCKS[r.bloc].assemble, r.bloc).toBe(true);
    expect(r.ingredients).toHaveLength(2);
    for (const i of r.ingredients) {
      expect(BIOMES.find((b) => b.block === i.bloc)?.classe, `${r.bloc} ${i.bloc}`).toBe(r.archipelago);
      expect(i.n).toBeLessThanOrEqual(5);
    }
    expect(r.ingredients.reduce((n, i) => n + i.n, 0)).toBe(3);
  }
  // Aucune île ne donne un bloc assemblé ; tout bloc assemblé a sa recette.
  for (const b of Object.values(BLOCKS).filter((x) => x.assemble)) {
    expect(BIOMES.some((i) => i.block === b.id)).toBe(false);
    expect(recetteDe(b.id)).toBeDefined();
  }
});

it('assemble un bloc à la fois, sans rien perdre quand il manque des blocs', () => {
  const state = { ...EMPTY_STATE, stock: { [BLOC.bois]: 5, [BLOC.brique]: 1 } };
  const poutre = recetteDe(BLOC.poutre)!;
  expect(assemblables(state.stock, poutre)).toBe(1);
  const r = assembleBlock(state, BLOC.poutre);
  expect(r.ok).toBe(true);
  expect(r.state.stock).toEqual({ [BLOC.bois]: 3, [BLOC.brique]: 0, [BLOC.poutre]: 1 });
  const encore = assembleBlock(r.state, BLOC.poutre);
  expect(encore.ok).toBe(false);
  expect(encore.state).toBe(r.state);
  expect(manquePour(r.state.stock, poutre)).toEqual([{ bloc: BLOC.brique, n: 1 }]);
  expect(assembleBlock(state, BLOC.bois)).toMatchObject({
    ok: false,
    reason: 'pas-de-recette',
  });
});

it('défait un bloc assemblé en poche : ses blocs reviennent, rien ne se perd', () => {
  const state = { ...EMPTY_STATE, stock: { [BLOC.bois]: 0, [BLOC.brique]: 0, [BLOC.poutre]: 1 } };
  const r = disassembleBlock(state, BLOC.poutre);
  expect(r.ok).toBe(true);
  expect(r.state.stock).toEqual({ [BLOC.bois]: 2, [BLOC.brique]: 1, [BLOC.poutre]: 0 });
  // Plus de poutre en poche : rien ne bouge.
  expect(disassembleBlock(r.state, BLOC.poutre)).toMatchObject({ ok: false, reason: 'plus-de-blocs', state: r.state });
  expect(disassembleBlock(state, BLOC.bois)).toMatchObject({ ok: false, reason: 'pas-de-recette' });
  // Assembler puis défaire rend l'inventaire d'avant.
  const avant = { ...EMPTY_STATE, stock: { [BLOC.bois]: 5, [BLOC.brique]: 3 } };
  expect(disassembleBlock(assembleBlock(avant, BLOC.poutre).state, BLOC.poutre).state.stock).toEqual({ [BLOC.bois]: 5, [BLOC.brique]: 3, [BLOC.poutre]: 0 });
});

it('garde les blocs assemblés d’une sauvegarde, et une case déjà posée d’un monument le reste', () => {
  const m = getMonument('landmark-6e-1')!;
  const case_ = planCells(m).find((c) => c.block === BLOC.poutre)!;
  // Une partie d'avant GD-2 avait posé du bois à cette case : elle reste posée, sans rien rendre ni reprendre.
  const avant = sanitizeState({
    stock: { [BLOC.bois]: 4 },
    world: { parts: { [m.id]: [case_.key] } },
  });
  expect(avant.world.parts[m.id]).toEqual([case_.key]);
  expect(avant.stock).toEqual({ [BLOC.bois]: 4 });
  expect(sanitizeState({ stock: { [BLOC.poutre]: 2 } }).stock).toEqual({
    [BLOC.poutre]: 2,
  });
  // Une poutre se pose à une case de poutre du monument.
  const libre = planCells(m).find((c) => c.block === BLOC.poutre && c.key !== case_.key)!;
  const pose = fillPlanCell({ ...avant, stock: { [BLOC.poutre]: 1 } }, m, libre.x, libre.y, libre.z);
  expect(pose.ok).toBe(true);
  expect(planStatus(pose.state, m).done).toBe(2);
});

it('chaque monument demande le bloc assemblé de son archipel', () => {
  for (const r of RECETTES) for (const m of monumentsOf(r.archipelago)) expect(planStatus(EMPTY_STATE, m).missing[r.bloc] ?? 0, m.id).toBeGreaterThan(0);
});

it('nomme les blocs assemblés et leur lieu selon l’univers, depuis docs/contenu/assemblage.md', () => {
  // Chaque univers a son lieu et ses noms (les règles nomment les univers sans lire leur couche).
  expect(Object.keys(ASSEMBLAGE.lieu).sort()).toEqual([...UNIVERS_IDS].sort());
  for (const r of ASSEMBLAGE.recettes) expect(Object.keys(r.noms).sort(), r.bloc).toEqual([...UNIVERS_IDS].sort());
  const md = readFileSync('docs/contenu/assemblage.md', 'utf8');
  expect(md).toContain('| `compound-6e` | 6e | french-6e-phonology × 2 · maths-6e-calculation × 1 | Poutre | Madrier |');
  expect(nomDuBloc(BLOC.poutre)).toBe('Poutre');
  expect(blockCount(BLOC.vitrail, 3)).toBe('3 vitraux');
  expect(textesDe('blocland').assemblage.titre).toBe('La Fabrique');
  expect(allerChercher(BLOC.poutre)).toBe('va à la Fabrique pour l’assembler');
  retenirReglages({ ...DEFAULT_SETTINGS, univers: 'archipeo' });
  expect(nomDuBloc(BLOC.poutre)).toBe('Madrier');
  expect(blockCount(BLOC.vitrail, 3)).toBe('3 hublots');
  expect(blockCount(BLOC.bois, 3)).toBe('3 blocs de bois');
  expect(textesDe('archipeo').assemblage.titre).toBe('La Halle aux matériaux');
  expect(allerChercher(BLOC.poutre)).toBe('va à la Halle aux matériaux pour l’assembler');
});

describe('le tirage des questions d’un bloc assemblé', () => {
  const cles = Array.from({ length: 12 }, (_, i) => `${BLOC.poutre}-${i}`);

  /** Pose `n` questions de suite, chacune juste ou non selon `juste(rang, cle)` ; rend les clés posées et le tirage. */
  function poser(n: number, juste: (rang: number, cle: string) => boolean, t: TirageAssemblage = tirageNeuf('eleve'), liste = cles) {
    const posees: string[] = [];
    for (let k = 0; k < n; k++) {
      const cle = prochaineQuestion(liste, t)!;
      posees.push(cle);
      t = noterQuestion(liste, t, cle, juste(k, cle));
    }
    return { posees, t };
  }

  it('suit une permutation propre à l’élève, toutes les questions une fois par tour, parcourue en boucle', () => {
    const { posees, t } = poser(36, () => true);
    for (let tour = 0; tour < 3; tour++) expect([...posees.slice(12 * tour, 12 * tour + 12)].sort()).toEqual([...cles].sort());
    expect(t.tour).toBe(3);
    // Un autre élève, un autre ordre ; un autre tour, un autre ordre.
    expect(poser(12, () => true, tirageNeuf('autre')).posees).not.toEqual(posees.slice(0, 12));
    expect(ordreDuTour(cles, { graine: 'eleve', tour: 1 })).not.toEqual(ordreDuTour(cles, { graine: 'eleve', tour: 0 }));
    expect(posees.slice(0, 12)).not.toEqual(cles);
  });

  it('ne repose jamais une question parmi les 6 dernières, même entre deux tours et avec des erreurs', () => {
    for (const liste of [cles, cles.slice(0, 8)])
      for (const graine of ['a', 'b', 'c', 'd']) {
        // Une erreur sur trois, environ.
        const { posees } = poser(200, (k, cle) => (k * 7 + cle.length) % 3 !== 0, tirageNeuf(graine), liste);
        posees.forEach((cle, k) => expect(posees.slice(Math.max(0, k - QUESTIONS_SANS_REDITE), k), `${graine} ${k}`).not.toContain(cle));
      }
  });

  it('une question manquée revient après au moins 3 autres, dès qu’elle sort des 6 dernières', () => {
    let t = tirageNeuf('eleve');
    const premiere = prochaineQuestion(cles, t)!;
    t = noterQuestion(cles, t, premiere, false);
    expect(t.ratees).toEqual([premiere]);
    const { posees, t: apres } = poser(10, () => true, t);
    const retour = posees.indexOf(premiere);
    expect(retour).toBeGreaterThanOrEqual(Math.max(RETOUR_DE_LA_MANQUEE, QUESTIONS_SANS_REDITE));
    expect(retour).toBe(QUESTIONS_SANS_REDITE);
    // Réussie, elle n'est plus à revoir.
    expect(apres.ratees).toEqual([]);
  });

  it('ignore une question qui n’existe plus, et se lit dans une sauvegarde sans rien casser', () => {
    const t = noterQuestion(cles, tirageNeuf('g'), `${BLOC.poutre}-0`, false);
    expect(noterQuestion(cles, t, `${BLOC.poutre}-99`, true)).toBe(t);
    expect(prochaineQuestion([], t)).toBeUndefined();
    // Une question retirée du fichier sort des listes.
    expect(noterQuestion(cles.slice(1), t, `${BLOC.poutre}-1`, true).ratees).toEqual([]);
    expect(lireTirage({ graine: 'g', tour: 2, posees: ['a', 'a', 3], recentes: 'x', ratees: ['b'] })).toEqual({
      graine: 'g',
      tour: 2,
      posees: ['a'],
      recentes: [],
      ratees: ['b'],
    });
    expect(lireTirage({ tour: 1 })).toBeUndefined();
    expect(lireTirage({ graine: '', tour: 1 })).toBeUndefined();
    expect(lireTirage({ graine: 'g', tour: -1 })?.tour).toBe(0);
  });

  it('la sauvegarde garde le tirage d’un bloc assemblé, et une sauvegarde d’avant n’en a pas', () => {
    expect('assemblyDraw' in sanitizeState({ stock: { [BLOC.bois]: 2 } })).toBe(false);
    expect('assemblyDraw' in sanitizeState(EMPTY_STATE)).toBe(false);
    const t = noterQuestion(cles, tirageNeuf('g'), `${BLOC.poutre}-3`, false);
    const lu = sanitizeState({ assemblyDraw: { [BLOC.poutre]: t, [BLOC.bois]: t, inconnu: t, [BLOC.vitrail]: { tour: 1 } } });
    expect(lu.assemblyDraw).toEqual({ [BLOC.poutre]: t });
    expect(sanitizeState(JSON.parse(JSON.stringify(lu)))).toEqual(lu);
  });

  it('une bonne réponse assemble le bloc ; une question manquée ne prend rien et sera reposée', () => {
    const state = { ...EMPTY_STATE, stock: { [BLOC.bois]: 2, [BLOC.brique]: 1 } };
    const tirage = tirageNeuf('g');
    const cle = prochaineQuestion(cles, tirage)!;
    const rate = repondreAssemblage(state, BLOC.poutre, { cles, cle, juste: false, tirage });
    expect(rate.assemble).toBe(false);
    expect(rate.state.stock).toEqual(state.stock);
    expect(rate.state.assemblyDraw?.[BLOC.poutre]?.ratees).toEqual([cle]);
    // Rien d'autre ne bouge : ni XP, ni étoiles, ni niveau, ni répétition espacée.
    expect({ ...rate.state, assemblyDraw: undefined }).toEqual({ ...state, assemblyDraw: undefined });
    const autre = prochaineQuestion(cles, rate.state.assemblyDraw![BLOC.poutre]!)!;
    expect(autre).not.toBe(cle);
    const juste = repondreAssemblage(rate.state, BLOC.poutre, { cles, cle: autre, juste: true, tirage });
    expect(juste.assemble).toBe(true);
    expect(juste.state.stock).toEqual({ [BLOC.bois]: 0, [BLOC.brique]: 0, [BLOC.poutre]: 1 });
    expect(juste.state.assemblyDraw?.[BLOC.poutre]?.recentes).toEqual([cle, autre]);
    // Plus assez de blocs : la réponse est notée, rien n'est assemblé ni perdu.
    const sans = repondreAssemblage(juste.state, BLOC.poutre, { cles, cle: `${BLOC.poutre}-5`, juste: true, tirage });
    expect(sans).toMatchObject({ assemble: false, reason: 'plus-de-blocs' });
    expect(sans.state.stock).toEqual(juste.state.stock);
    expect(repondreAssemblage(state, BLOC.bois, { cles, cle, juste: true, tirage })).toMatchObject({ assemble: false, reason: 'pas-de-recette' });
  });
});
