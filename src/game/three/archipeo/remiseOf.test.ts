// La commande d'un habitant vue par le monde ouvert (GD-20, point 4, lot L1) : chaque commande du 6e a sa remise, son
// lieu, son aménagement, un élément par ressource ; les seize phrases de fin ; chaque forme remplie avec les seize
// commandes (le plafond de mots compté sur le texte écrit, ni « à le » ni accolade) ; la ligne de l'habitant (prête, ou
// ce qui manque et où aller) ; la commande prête dans la suggestion ; les pastilles ; et la livraison, celle de la grille,
// sans rien de neuf dans la sauvegarde. Lot L2, l'entraide : chaque étape du 6e à son lieu, ses phrases remplies (le
// même plafond de mots), sa ligne, sa remise (la caisse, l'objet apporté), sa place dans la suggestion et les pastilles,
// et l'étape faite, celle de la grille (`tapStoryStep`), sans rien de neuf dans la sauvegarde.
import { describe, expect, it } from 'vitest';
import { frenchTypography } from '../../../components/math/RichText';
import { BLOCKS, blockCount, blockName } from '../../biomes';
import { sanitizeState } from '../../engine';
import { lieuDAssemblage } from '../../world/assembly';
import { amenagementById } from '../../world/continu/amenagements';
import { PLACES } from '../../world/continu/plan6e';
import { ENTRAIDE_PHRASES, HABITANT_PHRASES, REMISE_TIMING, REVISION_PHRASES, filled, questionsWord, remiseDuration, voiceFallbackMs, type HabitantPhrases } from '../../world/continu/remise';
import { COMMANDES, livrerLaCommande } from '../../world/requests';
import { STORIES, STORY_XP, tapStoryStep } from '../../world/stories';
import { posedAmenagements } from './amenagements';
import {
  entraideIcon,
  MAX_SIGNS,
  commandLines,
  entraideLineOf,
  entraideListLine,
  entraideOf,
  entraideRemiseOf,
  entraideSuggestion,
  habitantLineOf,
  habitantSigns,
  placeOfCommande,
  readyCommande,
  remiseOf,
  sourceOf,
  stepPhrase,
  suggestedAction,
  tokensOf,
} from './remiseOf';

const COMMANDES_6E = COMMANDES.filter((c) => amenagementById(c.fixture));
/** Le lieu où l'on assemble, dans sa forme « à », tel que l'écrit docs/contenu/assemblage.md (une seule source). */
const ENTREPOT = lieuDAssemblage('archipeo').a;
/**
 * Le plafond de mots d'une phrase d'habitant, compté sur le texte rempli (docs/contenu/monde-ouvert.md) : un nombre, un
 * mot élidé (« l’Imprimerie », « C’est ») comptent pour un mot.
 */
const MOTS_PAR_PHRASE = 10;
const etat = (raw: Record<string, unknown>) => sanitizeState(raw);
const byPlace = (place: string) => COMMANDES_6E.find((c) => placeOfCommande(c) === place)!;

/**
 * Le plafond de la remise sans toucher, sans voix : le temps de lire la consigne, puis la pose (directeur artistique,
 * point 5 : 10 s au plus ; le délai de lecture allongé pour un lecteur dyslexique, référent dys, relecture du lot L1).
 */
const REMISE_MAX_S = 10;

describe('La remise de chaque commande du 6e', () => {
  it('sans voix, la consigne puis la pose tiennent en 10 s au plus, pour chacune des seize commandes (sa phrase réelle, ses éléments)', () => {
    for (const c of COMMANDES_6E) {
      const r = remiseOf(c.id)!;
      const total = voiceFallbackMs(frenchTypography(r.consigne)) / 1000 + remiseDuration(r.elements);
      expect(total, `${c.id} : « ${r.consigne} »`).toBeLessThanOrEqual(REMISE_MAX_S);
    }
  });

  it('seize commandes, chacune à son lieu, son aménagement, un élément par ressource livrée', () => {
    expect(COMMANDES_6E).toHaveLength(16);
    for (const c of COMMANDES_6E) {
      const r = remiseOf(c.id);
      expect(r, c.id).not.toBeNull();
      expect(r!.place).toBe(amenagementById(c.fixture)!.place);
      expect(r!.play).toEqual({ place: r!.place, amenagement: c.fixture });
      expect(r!.kind).toBe('livrer');
      expect(r!.xp).toBeUndefined();
      expect(r!.elements).toBe(c.count);
      expect(r!.consigne).toMatch(/^Tu livres \d .+ pour (le |la |l’).+\.$/);
      expect(r!.role.length).toBeGreaterThan(0);
    }
    // Une commande d'une autre classe n'a pas de remise dans le monde ouvert du 6e.
    expect(remiseOf(COMMANDES.find((c) => !amenagementById(c.fixture))!.id)).toBeNull();
  });

  it('les seize phrases de fin, sans accord à faire', () => {
    expect(Object.fromEntries(COMMANDES_6E.map((c) => [placeOfCommande(c), remiseOf(c.id)!.done]))).toEqual({
      phare: 'Le potager est en place.',
      printworks: 'Le puits est en place.',
      archives: 'La grue est en place.',
      filets: 'Le bac à eau est en place.',
      lookout: 'Le poteau-lanterne est en place.',
      quais: 'La boutique est en place.',
      ecluses: 'Le lavoir est en place.',
      saltworks: 'Le parasol est en place.',
      beacons: 'La pendule est en place.',
      ferry: 'La vitrine est en place.',
      ruins: 'Le tamis est en place.',
      observatory: 'La placette est en place.',
      mangrove: 'Le nichoir est en place.',
      engine: 'L’étagère à flacons est en place.',
      shipyard: 'L’établi est en place.',
      commons: 'L’urne est en place.',
    });
  });
});

describe('Chaque forme, remplie avec les seize commandes du 6e', () => {
  // Toutes les formes, avec chaque lieu du 6e et le lieu où l'on assemble : chaque texte que l'élève peut lire.
  const formes = Object.keys(HABITANT_PHRASES) as (keyof HabitantPhrases)[];
  const textes = COMMANDES_6E.flatMap((c) => [...PLACES.map((p) => p.at), ENTREPOT].flatMap((at) => formes.map((k) => ({ c: c.id, k, text: filled(HABITANT_PHRASES[k], tokensOf(c, at)) }))));
  const phrases = (text: string) => text.split(/(?<=\.)\s+/);
  const mots = (phrase: string) => phrase.split(/\s+/).filter(Boolean).length;

  it(`${MOTS_PAR_PHRASE} mots au plus par phrase, comptés sur le texte écrit, et la plus longue l’atteint`, () => {
    const longues = textes.flatMap(({ c, text }) => phrases(text).filter((p) => mots(p) > MOTS_PAR_PHRASE).map((p) => `${c} : « ${p} » (${mots(p)} mots)`));
    expect(longues).toEqual([]);
    // Le plafond est serré : la règle écrite dit ce que l'élève lit, pas moins.
    expect(Math.max(...textes.flatMap(({ text }) => phrases(text).map(mots)))).toBe(MOTS_PAR_PHRASE);
  });

  it('ni « à le », « à les », « de le », « de les », ni accolade, ni espace double ; un point à la fin', () => {
    const fautes = textes.filter(({ text }) => /(^|\s)(à|de) (le|les)\s|[{}]|\s{2}/u.test(text) || !text.endsWith('.')).map(({ c, k, text }) => `${c} ${k} : ${text}`);
    expect(fautes).toEqual([]);
  });

  it('le nom de la ressource n’est jamais raccourci : celui de la réserve, avec son nombre', () => {
    for (const c of COMMANDES_6E) {
      const r = remiseOf(c.id)!;
      expect(r.consigne).toContain(tokensOf(c, '').objet);
      expect(habitantLineOf({ stock: { [c.block]: c.count }, world: etat({ world: { links: [], requests: [c.id] } }).world }, r.place, ENTREPOT)?.text).toContain(tokensOf(c, '').objet);
    }
  });
});

describe('La ligne de l’habitant', () => {
  const potager = byPlace('phare');

  it('rien tant que la commande n’est pas arrivée, ni une fois livrée', () => {
    expect(habitantLineOf(etat({ stock: { [potager.block]: 9 }, world: { links: [] } }), 'phare', ENTREPOT)).toBeNull();
    const arrivee = etat({ stock: { [potager.block]: 9 }, world: { links: [], requests: [potager.id] } });
    const livree = livrerLaCommande(arrivee, potager.id);
    expect(livree.ok && habitantLineOf(livree.state, 'phare', ENTREPOT)).toBeNull();
  });

  it('prête : le lieu de l’habitant dans la phrase, « Livrer »', () => {
    const s = etat({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } });
    expect(habitantLineOf(s, 'phare', ENTREPOT)).toEqual({ kind: 'livrer', commande: potager.id, role: 'La gardienne du phare', text: 'Livre 3 blocs de terre au Phare.' });
  });

  it('il manque des blocs : la demande, le lieu de la ressource, « Y aller » y mène', () => {
    const s = etat({ stock: {}, world: { links: [], requests: [potager.id] } });
    const line = habitantLineOf(s, 'phare', ENTREPOT);
    expect(line?.kind).toBe('manque');
    const go = sourceOf(potager);
    expect(go && 'place' in go).toBe(true);
    expect(line).toMatchObject({ go });
    expect(line?.text).toMatch(/^Il me faut 3 blocs de terre\. C’est pour le potager\. Joue une mission (au|à la|à l’|aux) .+\.$/);
  });

  it('un bloc assemblé : le lieu où l’on assemble, son nom entier, celui de docs/contenu/assemblage.md', () => {
    const assemblee = COMMANDES_6E.find((c) => sourceOf(c) && 'port' in sourceOf(c)!);
    expect(assemblee).toBeDefined();
    const place = placeOfCommande(assemblee!)!;
    const line = habitantLineOf(etat({ stock: {}, world: { links: [], requests: [assemblee!.id] } }), place, ENTREPOT);
    expect(line).toMatchObject({ kind: 'manque', go: { port: 'chantier' } });
    expect(ENTREPOT).toBe('à l’Entrepôt des matériaux');
    expect(line?.text).toMatch(/Assemble les .+ à l’Entrepôt des matériaux\.$/);
  });

  it('la liste « Commandes » : les commandes ouvertes, dans l’ordre d’arrivée', () => {
    const [a, b] = [byPlace('quais'), byPlace('phare')];
    const s = etat({ stock: { [b.block]: b.count }, world: { links: [], requests: [a.id, b.id] } });
    expect(commandLines(s, ENTREPOT).map((l) => [l.place, l.line.kind])).toEqual([
      ['quais', 'manque'],
      ['phare', 'livrer'],
    ]);
  });
});

describe('La commande prête dans la suggestion', () => {
  const [quais, phare] = [byPlace('quais'), byPlace('phare')];
  const s = etat({ stock: { [quais.block]: 9, [phare.block]: 9 }, world: { links: [], requests: [quais.id, phare.id] } });

  it('celle de l’habitant chez qui se tient Kéo, sinon celle de la prochaine destination du jeu, sinon la première arrivée ; jamais dans un lieu fermé', () => {
    expect(readyCommande(s, () => true)).toEqual({ commande: quais.id, place: 'quais', text: expect.stringMatching(/^Livre \d .+ aux Quais\.$/) });
    expect(readyCommande(s, () => true, phare.id)).toEqual({ commande: phare.id, place: 'phare', text: 'Livre 3 blocs de terre au Phare.' });
    expect(readyCommande(s, (p) => p !== 'quais')?.place).toBe('phare');
    // Chez un habitant dont la commande est prête, la sienne d'abord.
    expect(readyCommande(s, () => true, quais.id, 'phare')?.commande).toBe(phare.id);
    expect(readyCommande(etat({ stock: {}, world: { links: [], requests: [quais.id] } }), () => true)).toBeNull();
  });

  it('à son rang : après le lieu où se tient Kéo tant qu’il y reste une mission jamais jouée, avant la prochaine mission', () => {
    const ready = readyCommande(s, () => true);
    expect(suggestedAction(ready, null, false)).toEqual({ kind: 'livrer', id: ready!.commande, place: ready!.place, text: ready!.text });
    expect(suggestedAction(ready, null, true)).toBeNull();
    expect(suggestedAction(null, null, false)).toBeNull();
  });
});

describe('Les pastilles des habitants', () => {
  const pretes = ['quais', 'phare', 'filets'].map(byPlace);
  const stock = Object.fromEntries(pretes.map((c) => [c.block, 9]));
  const s = etat({ stock, world: { links: [], requests: pretes.map((c) => c.id) } });

  it('la suggérée d’abord, puis les commandes prêtes, puis les révisions ; trois au plus, une par lieu', () => {
    const signs = habitantSigns(s, { open: () => true, revisions: (p) => p === 'ecluses' || p === 'quais', suggested: pretes[1].id });
    expect(signs.map((x) => [x.place, x.kind, x.suggested])).toEqual([
      ['phare', 'commande', true],
      ['quais', 'commande', false],
      ['filets', 'commande', false],
    ]);
    expect(signs).toHaveLength(MAX_SIGNS);
    expect(signs[0].label).toMatch(/^Commande, .+, au Phare$/);
  });

  it('jamais dans un lieu fermé ; une révision due a sa pastille', () => {
    const signs = habitantSigns(s, { open: (p) => p !== 'filets', revisions: (p) => p === 'ecluses' });
    expect(signs.map((x) => [x.place, x.kind])).toEqual([
      ['quais', 'commande'],
      ['phare', 'commande'],
      ['ecluses', 'revision'],
    ]);
    expect(signs[2].label).toBe('Révisions, aux Écluses');
  });
});

describe('La livraison : celle de la grille, sans rien de neuf dans la sauvegarde', () => {
  it('chaque commande du 6e, livrée, pose son aménagement à son lieu ; la sauvegarde se relit telle quelle', () => {
    for (const c of COMMANDES_6E) {
      const avant = etat({ stock: { [c.block]: c.count }, world: { links: [], requests: [c.id] } });
      const r = livrerLaCommande(avant, c.id);
      expect(r.ok, c.id).toBe(true);
      if (!r.ok) continue;
      expect(posedAmenagements(r.state.world.parts)[remiseOf(c.id)!.place]).toContain(c.fixture);
      // Aucun champ de plus : les mêmes clés qu'avant, sans la liste des commandes vidée.
      expect(Object.keys(r.state.world).sort()).toEqual(Object.keys(avant.world).filter((k) => k !== 'requests').sort());
      expect(sanitizeState(JSON.parse(JSON.stringify(r.state)))).toEqual(r.state);
      // Une seconde livraison ne compte pas deux fois.
      expect(livrerLaCommande(r.state, c.id).ok).toBe(false);
    }
  });
});

/** Le monde avec l'entraide `story` ouverte à son étape `step` (la sauvegarde de la grille, `world.stories`). */
const avecEntraide = (story: string, step: number, stock: Record<string, number> = {}, extra: Record<string, unknown> = {}) =>
  etat({ stock, world: { links: [], stories: [{ id: story, step }], ...extra } });
const STORIES_6E = STORIES.filter((x) => x.region === '6e');

describe('L’entraide du 6e dans le monde ouvert (lot L2)', () => {
  it('chaque étape se fait dans un lieu du monde ouvert, et sa phrase le nomme', () => {
    expect(STORIES_6E).toHaveLength(3);
    for (const story of STORIES_6E)
      for (const [i, step] of story.steps.entries()) {
        const e = entraideOf(avecEntraide(story.id, i));
        expect(e, `${story.id} ${i}`).not.toBeNull();
        expect(stepPhrase(story, step)).toContain(PLACES.find((p) => p.id === e!.place)!.at);
      }
    expect(STORIES_6E.map((x) => x.steps.map((st) => stepPhrase(x, st)))).toEqual([
      ['Joue une mission aux Quais.', 'Donne 2 blocs de bois aux Quais.', 'Apporte la lanterne au Phare.'],
      ['Joue une mission aux Archives.', 'Donne 3 galets aux Archives.', 'Apporte le portillon aux Filets.'],
      ['Joue une mission au Chantier naval.', 'Donne 3 aimants au Chantier naval.', 'Joue une mission à la Vigie.', 'Apporte l’escalier à la Vigie.'],
    ]);
  });

  it(`chaque forme de l’entraide, remplie avec chaque étape et chaque lieu : ${MOTS_PAR_PHRASE} mots au plus par phrase, ni « à le » ni accolade`, () => {
    const mots = (phrase: string) => phrase.split(/\s+/).filter(Boolean).length;
    const ats = [...PLACES.map((p) => p.at), ENTREPOT];
    const textes = STORIES_6E.flatMap((story) =>
      story.steps.flatMap((st) => {
        if (st.kind !== 'give') return [...ats.map((auLieu) => filled(ENTRAIDE_PHRASES.stepMission, { auLieu })), ...ats.map((auLieu) => filled(ENTRAIDE_PHRASES.stepBring, { nom: story.name, auLieu }))];
        const objet = blockCount(st.block, st.count);
        return [
          ...ats.map((auLieu) => filled(ENTRAIDE_PHRASES.stepGive, { objet, auLieu })),
          ...ats.map((auLieu) => filled(HABITANT_PHRASES.ask, { objet, nom: story.name, auLieu })),
          ...ats.map((auLieu) => filled(HABITANT_PHRASES.askAssembled, { objet, nom: story.name, blocs: blockName(st.block, st.count), auLieu })),
          filled(ENTRAIDE_PHRASES.giveRemise, { objet, nom: story.name }),
          filled(ENTRAIDE_PHRASES.bringRemise, { nom: story.name }),
          filled(HABITANT_PHRASES.done, { nom: story.name }),
        ];
      }),
    );
    const longues = textes.flatMap((t) => t.split(/(?<=\.)\s+/).filter((p) => mots(p) > MOTS_PAR_PHRASE).map((p) => `« ${p} »`));
    expect(longues).toEqual([]);
    expect(textes.filter((t) => /(^|\s)(à|de) (le|les)\s|[{}]|\s{2}/u.test(t) || !t.endsWith('.'))).toEqual([]);
  });

  it(`les phrases de la révision, remplies d’une et de huit questions, et le rappel : ${MOTS_PAR_PHRASE} mots au plus par phrase, sans accolade`, () => {
    const mots = (phrase: string) => phrase.split(/\s+/).filter(Boolean).length;
    expect([questionsWord(1), questionsWord(8)]).toEqual(['1 question', '8 questions']);
    const textes = [1, 8].flatMap((n) => [filled(REVISION_PHRASES.entry, { questions: questionsWord(n) }), filled(REVISION_PHRASES.done, { questions: questionsWord(n) })]);
    textes.push(REVISION_PHRASES.reminder);
    expect(textes).toEqual(['Tu revois 1 question.', 'Tu as revu 1 question.', 'Tu revois 8 questions.', 'Tu as revu 8 questions.', 'On revoit quelques questions ensemble.']);
    const longues = textes.flatMap((t) => t.split(/(?<=\.)\s+/).filter((p) => mots(p) > MOTS_PAR_PHRASE));
    expect(longues).toEqual([]);
    expect(textes.filter((t) => /[{}]|\s{2}/u.test(t) || !t.endsWith('.'))).toEqual([]);
  });

  it('l’icône de la lanterne pas encore posée : éteinte (verre mat, chapeau sombre), jamais le jaune de sa lueur ; les autres objets gardent leur bloc', () => {
    expect(entraideIcon('lantern')).toEqual({ top: '#4a4f55', side: '#cfd9d6' });
    expect(entraideIcon('lantern').top).not.toBe(BLOCKS.lantern.top);
    for (const story of STORIES_6E.filter((x) => x.item !== 'lantern')) expect(entraideIcon(story.item)).toEqual({ top: BLOCKS[story.item].top, side: BLOCKS[story.item].side });
  });

  it('la ligne de l’habitant : « Donner » avec assez de blocs, sinon ce qui manque (la forme « demande ») ; « Apporter » ; rien pour une mission', () => {
    const lanterne = STORIES_6E[0];
    expect(entraideLineOf(avecEntraide(lanterne.id, 0), 'quais', ENTREPOT)).toBeNull();
    expect(entraideLineOf(avecEntraide(lanterne.id, 1, { 'french-6e-phonology': 2 }), 'quais', ENTREPOT)).toMatchObject({ kind: 'donner', story: lanterne.id, text: 'Donne 2 blocs de bois aux Quais.' });
    // Ailleurs que chez l'habitant de l'étape : rien.
    expect(entraideLineOf(avecEntraide(lanterne.id, 1, { 'french-6e-phonology': 2 }), 'phare', ENTREPOT)).toBeNull();
    const manque = entraideLineOf(avecEntraide(lanterne.id, 1, { 'french-6e-phonology': 1 }), 'quais', ENTREPOT);
    expect(manque).toMatchObject({ kind: 'manque', text: 'Il me faut 2 blocs de bois. C’est pour la lanterne. Joue une mission au Phare.', go: { place: 'phare' } });
    expect(entraideLineOf(avecEntraide(lanterne.id, 2), 'phare', ENTREPOT)).toMatchObject({ kind: 'apporter', text: 'Apporte la lanterne au Phare.' });
    // En tête de la liste « Commandes » : l'étape à son lieu, ou ce qui manque, avec où mène « Y aller ».
    expect(entraideListLine(avecEntraide(lanterne.id, 0), () => true, ENTREPOT)).toMatchObject({ index: 0, place: 'quais', text: 'Joue une mission aux Quais.', go: { place: 'quais' } });
    expect(entraideListLine(avecEntraide(lanterne.id, 1), () => true, ENTREPOT)).toMatchObject({ go: { place: 'phare' } });
    expect(entraideListLine(avecEntraide(lanterne.id, 0), (p) => p !== 'quais', ENTREPOT)).toBeNull();
  });

  it('la remise de « Donner » : la caisse et un élément par bloc donné, la fin dit l’étape suivante ; celle d’« Apporter » : l’objet d’un seul bloc, depuis la main de Kéo, puis 50 XP', () => {
    for (const story of STORIES_6E) {
      const gi = story.steps.findIndex((st) => st.kind === 'give');
      const give = story.steps[gi];
      if (give.kind !== 'give') throw new Error(story.id);
      expect(entraideRemiseOf(avecEntraide(story.id, gi, { [give.block]: give.count - 1 }), story.id)).toBeNull();
      const d = entraideRemiseOf(avecEntraide(story.id, gi, { [give.block]: give.count }), story.id)!;
      expect(d).toMatchObject({ kind: 'donner', elements: give.count, block: give.block, done: stepPhrase(story, story.steps[gi + 1]) });
      expect(d.play).toMatchObject({ place: d.place, caisse: { count: give.count } });
      expect(d.consigne).toBe(`Tu donnes ${blockCount(give.block, give.count)} pour ${story.name}.`);
      expect(d.xp).toBeUndefined();
      const last = story.steps.length - 1;
      const a = entraideRemiseOf(avecEntraide(story.id, last), story.id)!;
      expect(a).toMatchObject({ kind: 'apporter', elements: 1, block: story.item, xp: STORY_XP, play: { place: a.place, amenagement: story.fixture, carry: true } });
      expect(amenagementById(story.fixture)!.place).toBe(a.place);
      expect(a.done).toMatch(/ est en place\.$/);
      // Une étape « mission » ne se fait pas d'un geste.
      expect(entraideRemiseOf(avecEntraide(story.id, 0), story.id)).toBeNull();
      // Sans voix, la remise tient en 10 s au plus.
      for (const r of [d, a]) expect(voiceFallbackMs(frenchTypography(r.consigne)) / 1000 + remiseDuration(r.elements, r.kind === 'apporter' ? REMISE_TIMING.carry : undefined)).toBeLessThanOrEqual(REMISE_MAX_S);
    }
  });

  it('la suggestion : l’étape juste après la commande prête, jamais ce qui manque ; jamais dans un lieu fermé', () => {
    const lanterne = STORIES_6E[0];
    const step = entraideSuggestion(avecEntraide(lanterne.id, 2), () => true);
    expect(step).toEqual({ kind: 'apporter', id: lanterne.id, place: 'phare', text: 'Apporte la lanterne au Phare.' });
    expect(entraideSuggestion(avecEntraide(lanterne.id, 0), () => true)).toMatchObject({ kind: 'mission', place: 'quais' });
    expect(entraideSuggestion(avecEntraide(lanterne.id, 1), () => true)).toBeNull();
    expect(entraideSuggestion(avecEntraide(lanterne.id, 1, { 'french-6e-phonology': 2 }), () => true)).toMatchObject({ kind: 'donner' });
    expect(entraideSuggestion(avecEntraide(lanterne.id, 2), (p) => p !== 'phare')).toBeNull();
    const potager = byPlace('phare');
    const s = avecEntraide(lanterne.id, 2, { [potager.block]: potager.count }, { requests: [potager.id] });
    const ready = readyCommande(s, () => true);
    expect(suggestedAction(ready, step, false)?.kind).toBe('livrer');
    expect(suggestedAction(null, step, false)).toBe(step);
    expect(suggestedAction(null, step, true)).toBeNull();
  });

  it('les pastilles : celle de l’étape a l’icône de l’objet et son nom lu, après les commandes prêtes ; pleine quand la suggestion la porte', () => {
    const lanterne = STORIES_6E[0];
    const quais = byPlace('quais');
    const s = avecEntraide(lanterne.id, 2, { [quais.block]: 9 }, { requests: [quais.id] });
    const signs = habitantSigns(s, { open: () => true, revisions: (p) => p === 'ecluses', titre: 'Entraide' });
    expect(signs.map((x) => [x.place, x.kind, x.block])).toEqual([
      ['quais', 'commande', quais.block],
      ['phare', 'entraide', lanterne.item],
      ['ecluses', 'revision', undefined],
    ]);
    expect(signs[1].label).toBe('Entraide, la lanterne, au Phare');
    const seule = habitantSigns(avecEntraide(lanterne.id, 2), { open: () => true, revisions: () => false, suggested: lanterne.id });
    expect(seule).toEqual([{ place: 'phare', kind: 'entraide', block: lanterne.item, suggested: true, label: 'Entraide, la lanterne, au Phare' }]);
    // Une étape « mission », ou des blocs qui manquent : pas de pastille (la marque porte la mission).
    expect(habitantSigns(avecEntraide(lanterne.id, 0), { open: () => true, revisions: () => false })).toEqual([]);
    expect(habitantSigns(avecEntraide(lanterne.id, 1), { open: () => true, revisions: () => false })).toEqual([]);
  });

  it('l’étape faite : celle de la grille (`tapStoryStep`), sans rien de neuf dans la sauvegarde ; à la dernière, l’objet posé à son lieu', () => {
    for (const story of STORIES_6E) {
      const gi = story.steps.findIndex((st) => st.kind === 'give');
      const give = story.steps[gi];
      if (give.kind !== 'give') throw new Error(story.id);
      const avant = avecEntraide(story.id, gi, { [give.block]: give.count });
      const r = tapStoryStep(avant, story.id);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.state.stock[give.block] ?? 0).toBe(0);
      expect(Object.keys(r.state.world).sort()).toEqual(Object.keys(avant.world).sort());
      expect(sanitizeState(JSON.parse(JSON.stringify(r.state)))).toEqual(r.state);
      const last = avecEntraide(story.id, story.steps.length - 1);
      const f = tapStoryStep(last, story.id);
      expect(f.ok && f.finished).toBe(true);
      if (!f.ok) continue;
      expect(posedAmenagements(f.state.world.parts)[entraideRemiseOf(last, story.id)!.place]).toContain(story.fixture);
      expect(sanitizeState(JSON.parse(JSON.stringify(f.state)))).toEqual(f.state);
      // Une seconde fois ne compte pas deux fois.
      expect(tapStoryStep(f.state, story.id).ok).toBe(false);
    }
  });
});
