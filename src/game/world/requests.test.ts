// Les commandes des habitants (GD-7, PR 3) : la règle d'arrivée du directeur artistique, l'ordre, la livraison, la
// suggestion (étape 3 de la prochaine destination), le signe de la créature, la sauvegarde et Archipéo.
import { BLOC, getBiome, missionsJouables, type BiomeId } from '../biomes';
import { exercisesOf } from '../exercises';
import { sanitizeState, type GameState } from '../engine';
import { textesDe } from '../../universes';
import { NOMS_ARCHIPELS } from './archipelago';
import {
  COMMANDES,
  MAX_COMMANDES_OUVERTES,
  SEUIL_DE_LA_PREMIERE_COMMANDE,
  commandeDeLIle,
  commandeMiseEnAvant,
  commandesOuvertes,
  estLivree,
  estPrete,
  faireArriverUneCommande,
  getCommande,
  livrerLaCommande,
  peutCommander,
  sansCommandes,
  seuilAtteint,
  signeDeLaCreature,
  texteDeLaCommande,
} from './requests';
import { lienDeLaDestination, nextDestination as nextDestinationDe } from './destination';
import { casesDeLaPetiteConstruction } from './fixtures';
import { planCells } from './plans';
import { getPlan } from './plans';

const mots = textesDe('blocland').libelles;
const nextDestination = (state: GameState) => nextDestinationDe(state, NOMS_ARCHIPELS, mots);
const FABRIQUE = textesDe('blocland').assemblage.a;

/** Toutes les missions d'une île, jouées une fois. */
const joue = (...iles: BiomeId[]) =>
  Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));

const FORET = 'french-6e-phonology';
const PLAINE = 'maths-6e-calculation';
const FERME = 'french-6e-grammar-spelling';
/** Le premier ouvrage payé : le pont de la Forêt à la Ferme. */
const PONT_FERME = 'french-6e-phonology-french-6e-grammar-spelling';
const MOUSSO = 'french-6e-phonology-request-1';
const COCO = 'maths-6e-calculation-request-1';

const etat = (raw: Record<string, unknown>) => sanitizeState(raw);

describe('l’arrivée', () => {
  it('le seuil : la première commande d’un archipel attend son premier ouvrage construit (décidé le 3 octobre 2026)', () => {
    expect(SEUIL_DE_LA_PREMIERE_COMMANDE).toBe('premier-ouvrage');
    const joueSansOuvrage = etat({ progress: joue(FORET, PLAINE), world: { links: [] } });
    // La liaison gratuite du couple de départ ne compte pas.
    expect(seuilAtteint(joueSansOuvrage, '6e')).toBe(false);
    expect(faireArriverUneCommande(joueSansOuvrage, '6e').arrivee).toBeNull();
    // L'autre choix proposé au mainteneur : dès la première mission réussie (une seule constante à changer).
    expect(faireArriverUneCommande(joueSansOuvrage, '6e', 'premiere-mission').arrivee?.id).toBe(COCO);
    const avecOuvrage = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME] } });
    expect(seuilAtteint(avecOuvrage, '6e')).toBe(true);
    // Le seuil d'un archipel ne vaut pas pour le suivant.
    expect(seuilAtteint(avecOuvrage, '5e')).toBe(false);
  });

  it('une au plus à chaque fois, la première dans l’ordre de archipel.md parmi celles qui peuvent commander', () => {
    const s0 = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME] } });
    const r1 = faireArriverUneCommande(s0, '6e');
    expect(r1.arrivee?.id).toBe(MOUSSO);
    expect(r1.state.world.requests).toEqual([MOUSSO]);
    const r2 = faireArriverUneCommande(r1.state, '6e');
    expect(r2.arrivee?.id).toBe(COCO);
    expect(r2.state.world.requests).toEqual([MOUSSO, COCO]);
    // Plus personne ne peut commander : rien n'arrive, l'état est rendu tel quel.
    const r3 = faireArriverUneCommande(r2.state, '6e');
    expect(r3.arrivee).toBeNull();
    expect(r3.state).toBe(r2.state);
    // L'ordre de la liste : l'ordre d'arrivée, la plus ancienne en tête.
    expect(commandesOuvertes(r2.state.world, '6e').map((c) => c.id)).toEqual([MOUSSO, COCO]);
  });

  it('les conditions : (a) l’île ouverte, (b) une mission réussie, (c) l’île du bloc ouverte, (d) pas encore livrée', () => {
    const mousso = getCommande(MOUSSO)!;
    const base = { progress: joue(FORET), world: { links: [PONT_FERME] } };
    expect(peutCommander(etat(base), mousso)).toBe(true);
    // (b) Aucune mission jouée sur la Forêt.
    expect(peutCommander(etat({ ...base, progress: {} }), mousso)).toBe(false);
    // (c) La Ferme, qui donne la terre, pas encore ouverte.
    expect(peutCommander(etat({ ...base, world: { links: [] } }), mousso)).toBe(false);
    // (d) Déjà livrée : sa petite construction est posée.
    const posee = { [mousso.fixture]: casesDeLaPetiteConstruction(mousso.fixture)!.map((c) => c.key) };
    expect(peutCommander(etat({ ...base, world: { links: [PONT_FERME], parts: posee } }), mousso)).toBe(false);
    // Déjà arrivée : une créature, une commande, une seule fois.
    expect(peutCommander(etat({ ...base, world: { links: [PONT_FERME], requests: [MOUSSO] } }), mousso)).toBe(false);
    // (a) L'île de la créature fermée : la Ferme n'est pas encore ouverte, Bloquette ne commande pas.
    const bloquette = commandeDeLIle(FERME)!;
    expect(peutCommander(etat({ progress: joue(FORET), world: { links: [] } }), bloquette)).toBe(false);
  });

  it('un bloc assemblé : les deux îles de sa recette ouvertes', () => {
    // Rouxel (la Carrière) demande des poutres : bois (la Forêt) et brique (la Plaine).
    const rouxel = getCommande('french-6e-word-spelling-request-1')!;
    const links = ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-french-6e-word-spelling'];
    expect(peutCommander(etat({ progress: joue('french-6e-word-spelling'), world: { links } }), rouxel)).toBe(true);
  });

  it('Grimoire ne commande qu’une fois « La lanterne du phare » bâtie (elle n’arrive pas avant, elle n’attend pas)', () => {
    const grimoire = commandeDeLIle('french-6e-reading')!;
    expect(grimoire.afterPlan).toBe('french-6e-reading-2');
    const links = [PONT_FERME, 'french-6e-grammar-spelling-french-6e-reading', 'maths-6e-calculation-maths-6e-decimals'];
    // Une seule mission jouée : la première partie de la Tour est posée, pas la lanterne.
    const tour = 'french-6e-reading';
    const une = { [exercisesOf(tour, missionsJouables(getBiome(tour)!)[0].id)[0].id]: { stars: 2, attempts: 1, best: 0.8 } };
    const avant = etat({ progress: une, world: { links } });
    expect(peutCommander(avant, grimoire)).toBe(false);
    const parts = { 'french-6e-reading-2': planCells(getPlan('french-6e-reading-2')!).map((c) => c.key) };
    expect(peutCommander(etat({ progress: une, world: { links, parts } }), grimoire)).toBe(true);
  });

  it('trois ouvertes au plus par archipel ; celles d’un archipel quitté restent et ne bloquent pas le suivant', () => {
    expect(MAX_COMMANDES_OUVERTES).toBe(3);
    const trois = ['french-6e-phonology-request-1', 'maths-6e-calculation-request-1', 'french-6e-letter-confusion-request-1'];
    const plein = etat({ progress: joue(FORET, PLAINE, 'french-6e-letter-confusion'), world: { links: [PONT_FERME, 'french-6e-phonology-french-6e-letter-confusion'], requests: trois } });
    expect(plein.world.requests).toEqual(trois);
    // Une quatrième pourrait commander (Bloquette, sur la Ferme), mais l'archipel en a trois.
    const links6 = [...plein.world.links, 'maths-6e-calculation-maths-6e-fractions'];
    const progress6 = joue(FORET, PLAINE, 'french-6e-letter-confusion', FERME);
    const avecFerme = etat({ progress: progress6, world: { links: links6, requests: trois } });
    expect(peutCommander(avecFerme, commandeDeLIle(FERME)!)).toBe(true);
    expect(faireArriverUneCommande(avecFerme, '6e').arrivee).toBeNull();
    // Le 5e : la Nef fait, un ouvrage payé ; Bazar (le Marché) commande des panneaux du Carrefour.
    const links5 = [...links6, 'passage-5e', 'maths-5e-proportionality-french-5e-homophones'];
    const au5e = etat({ progress: { ...progress6, ...joue('maths-5e-proportionality') }, world: { links: links5, place: 'maths-5e-proportionality', requests: trois } });
    const r = faireArriverUneCommande(au5e, '5e');
    expect(r.arrivee?.id).toBe('maths-5e-proportionality-request-1');
    // Les trois de l'archipel quitté restent, dans leur ordre ; chaque archipel montre les siennes.
    expect(commandesOuvertes(r.state.world, '6e').map((c) => c.id)).toEqual(trois);
    expect(commandesOuvertes(r.state.world, '5e').map((c) => c.id)).toEqual(['maths-5e-proportionality-request-1']);
  });
});

describe('prête, livrée', () => {
  const ouverte = (stock: Partial<Record<string, number>>) => etat({ progress: joue(FORET, PLAINE), stock, world: { links: [PONT_FERME], requests: [MOUSSO, COCO] } });

  it('les phrases : le nombre et le nom de Mes blocs, le lieu où l’on assemble', () => {
    const mousso = getCommande(MOUSSO)!;
    expect(texteDeLaCommande(mousso, 'ask', FABRIQUE)).toBe('Il me faut 3 blocs de terre pour mon potager. Joue une mission de la Ferme des accords.');
    expect(texteDeLaCommande(mousso, 'ready', FABRIQUE)).toBe('Tu as les blocs de terre\u00a0! Livre-les à Mousso.');
    expect(texteDeLaCommande(getCommande('french-6e-letter-confusion-request-1')!, 'ready', FABRIQUE)).toBe('Tu as les briques\u00a0! Livre-les à Tunel.');
    expect(texteDeLaCommande(getCommande('french-6e-word-spelling-request-1')!, 'ask', FABRIQUE)).toBe('Il me faut 2 poutres pour ma grue. Assemble-les à la Fabrique.');
    // Aucun jeton ne reste, dans aucune phrase.
    for (const c of COMMANDES) for (const p of ['ask', 'ready', 'done'] as const) expect(texteDeLaCommande(c, p, FABRIQUE)).not.toMatch(/[{}]/);
  });

  it('prête quand les blocs sont dans l’inventaire ; mise en avant : la plus ancienne des prêtes', () => {
    const mousso = getCommande(MOUSSO)!;
    expect(estPrete(ouverte({ [BLOC.terre]: 2 }), mousso)).toBe(false);
    expect(estPrete(ouverte({ [BLOC.terre]: 3 }), mousso)).toBe(true);
    // Seule celle de Coco est prête : c'est elle ; les deux prêtes : la plus ancienne, Mousso.
    expect(commandeMiseEnAvant(ouverte({ [BLOC.bois]: 3 }), '6e')?.id).toBe(COCO);
    expect(commandeMiseEnAvant(ouverte({ [BLOC.bois]: 3, [BLOC.terre]: 3 }), '6e')?.id).toBe(MOUSSO);
    expect(commandeMiseEnAvant(ouverte({}), '6e')).toBeUndefined();
  });

  it('Livrer : les blocs sortent, la petite construction se pose, la commande sort de la liste, sans coffre ni XP', () => {
    const avant = ouverte({ [BLOC.terre]: 5, [BLOC.bois]: 1 });
    const r = livrerLaCommande(avant, MOUSSO);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.stock[BLOC.terre]).toBe(2);
    expect(r.state.stock[BLOC.bois]).toBe(1);
    const mousso = getCommande(MOUSSO)!;
    expect(r.state.world.parts[mousso.fixture]).toEqual(casesDeLaPetiteConstruction(mousso.fixture)!.map((c) => c.key));
    expect(r.state.world.requests).toEqual([COCO]);
    // Rien d'autre ne change : ni les plans, ni le journal, ni les coffres.
    expect(r.state.world.log).toEqual(avant.world.log);
    expect(r.state.chests).toBe(avant.chests);
    expect(texteDeLaCommande(r.commande, 'done', FABRIQUE)).toBe('Potager posé chez Mousso\u00a0!');
    // Livrée, elle ne revient jamais.
    expect(peutCommander(r.state, mousso)).toBe(false);
    // La dernière livrée : le champ disparaît.
    const r2 = livrerLaCommande({ ...r.state, stock: { ...r.state.stock, [BLOC.bois]: 3 } }, COCO);
    expect(r2.ok && r2.state.world.requests).toBeUndefined();
  });

  it('pas prête, ou pas arrivée : rien ne change', () => {
    const avant = ouverte({ [BLOC.terre]: 1 });
    expect(livrerLaCommande(avant, MOUSSO)).toMatchObject({ ok: false, reason: 'blocs', manque: 2, state: avant });
    expect(livrerLaCommande(avant, 'french-6e-letter-confusion-request-1')).toMatchObject({ ok: false, reason: 'pas-ouverte', state: avant });
  });
});

describe('la suggestion et le signe', () => {
  // Le bonhomme sur la Plaine, toutes ses missions jouées, rien de prêt sur elle ; la commande de Mousso prête.
  const prete = etat({
    progress: joue(FORET, PLAINE, FERME),
    stock: { [BLOC.terre]: 3 },
    world: { links: [PONT_FERME], place: PLAINE, requests: [COCO, MOUSSO] },
  });

  it('étape 3 : la plus ancienne commande prête de l’archipel, chez sa créature, avec sa phrase', () => {
    const d = nextDestination(prete);
    expect(d).toMatchObject({ island: FORET, text: 'Tu as les blocs de terre\u00a0! Livre-les à Mousso.', have: 3, need: 3, commande: MOUSSO });
    expect(d.ouvrage).toBeUndefined();
    // « Y aller » ouvre l'île de la créature sur sa ligne, comme un ouvrage.
    expect(lienDeLaDestination(d)).toBe(`/adventure/${FORET}?worksite=${MOUSSO}`);
    // Pas prête : pas de commande dans la suggestion.
    expect(nextDestination({ ...prete, stock: {} }).commande).toBeUndefined();
  });

  it('un seul signe par créature : la commande prête et suggérée, sinon les révisions, sinon rien', () => {
    expect(signeDeLaCreature(prete, FORET, { revisions: true, suggeree: MOUSSO })).toEqual({ genre: 'commande', bloc: BLOC.terre, commande: MOUSSO });
    // Prête mais pas suggérée : pas de signe de commande.
    expect(signeDeLaCreature(prete, FORET, { revisions: true, suggeree: undefined })).toEqual({ genre: 'revision' });
    expect(signeDeLaCreature(prete, FORET, { revisions: false, suggeree: undefined })).toBeNull();
    // Suggérée mais pas prête (plus de blocs) : les révisions.
    expect(signeDeLaCreature({ ...prete, stock: {} }, FORET, { revisions: true, suggeree: MOUSSO })).toEqual({ genre: 'revision' });
    // Coco : sa commande n'est pas prête.
    expect(signeDeLaCreature(prete, PLAINE, { revisions: false, suggeree: MOUSSO })).toBeNull();
  });
});

describe('la sauvegarde', () => {
  it('une sauvegarde d’avant les commandes se lit sans rien perdre, sans champ nouveau', () => {
    const ancienne = { progress: joue(FORET, PLAINE), stock: { [BLOC.bois]: 4 }, world: { parts: {}, log: [], links: [PONT_FERME], place: PLAINE } };
    const lue = sanitizeState(structuredClone(ancienne));
    // Le défi de la Plaine, ouvert avant les missions du 9 octobre 2026, le reste (GD-14, format 5) : le seul champ ajouté.
    expect(lue.world).toEqual({ parts: lue.world.parts, log: [], links: [PONT_FERME], place: PLAINE, challengesKeptOpen: [PLAINE] });
    expect('requests' in lue.world).toBe(false);
    expect(lue.stock).toEqual({ [BLOC.bois]: 4 });
    expect(Object.keys(lue.progress)).toEqual(Object.keys(ancienne.progress));
    // Relue, elle ne change plus.
    expect(sanitizeState(JSON.parse(JSON.stringify(lue)))).toEqual(lue);
  });

  it('les commandes arrivées et les petites constructions posées se relisent telles quelles', () => {
    const r = faireArriverUneCommande(etat({ progress: joue(FORET, PLAINE), stock: { [BLOC.terre]: 3 }, world: { links: [PONT_FERME] } }), '6e');
    const deux = faireArriverUneCommande(r.state, '6e').state;
    const livree = livrerLaCommande(deux, MOUSSO);
    expect(livree.ok).toBe(true);
    const relue = sanitizeState(JSON.parse(JSON.stringify(livree.state)));
    expect(relue).toEqual(livree.state);
    expect(relue.world.requests).toEqual([COCO]);
  });

  it('nettoie ce qui ne se lit pas : une commande inconnue, en double, déjà livrée, une quatrième ; une petite construction inconnue ou sans case', () => {
    const mousso = getCommande(MOUSSO)!;
    const cles = casesDeLaPetiteConstruction(mousso.fixture)!.map((c) => c.key);
    const lue = sanitizeState({
      world: {
        links: [],
        parts: { [mousso.fixture]: cles, 'maths-6e-calculation-fixture-1': [], 'maths-6e-fractions-fixture-1': 'oui', 'inconnue-fixture-1': ['0,0,0'] },
        requests: [
          'inconnue',
          COCO,
          COCO,
          MOUSSO,
          42,
          'french-6e-letter-confusion-request-1',
          'french-6e-word-spelling-request-1',
          'french-6e-grammar-spelling-request-1',
          'maths-5e-proportionality-request-1',
        ],
      },
    });
    expect(lue.world.parts).toEqual({ [mousso.fixture]: cles });
    expect(lue.world.requests).toEqual([COCO, 'french-6e-letter-confusion-request-1', 'french-6e-word-spelling-request-1', 'maths-5e-proportionality-request-1']);
  });

  it('l’identifiant prouve la livraison : des clés anciennes, d’une forme redessinée ou à moitié, se relisent livrées avec la forme d’aujourd’hui', () => {
    const coco = getCommande(COCO)!;
    const forme = casesDeLaPetiteConstruction(coco.fixture)!.map((c) => c.key);
    for (const anciennes of [['0,0,0'], ['9,9,9', '8,8,8'], forme.slice(0, 1)]) {
      const lue = sanitizeState({ world: { links: [], parts: { [coco.fixture]: anciennes } } });
      expect(lue.world.parts[coco.fixture]).toEqual(forme);
      expect(estLivree(lue.world, coco)).toBe(true);
      // Relue, elle ne change plus.
      expect(sanitizeState(JSON.parse(JSON.stringify(lue)))).toEqual(lue);
    }
  });
});

describe('Les commandes dans chaque univers', () => {
  it('Blocland et Archipéo (décision du 4 octobre 2026) en ont les mots', () => {
    expect(textesDe('blocland').commandes?.titre).toBe('Commandes');
    expect(textesDe('archipeo').commandes?.titre).toBe('Commandes');
    expect(textesDe('archipeo').commandes?.compte(2, 0)).toBe('2 en attente');
    expect(textesDe('archipeo').commandes?.compte(2, 1)).toBe('1 prête');
    expect(textesDe('archipeo').commandes?.compte(3, 2)).toBe('2 prêtes');
  });

  it('un univers sans ces mots n’a pas de commandes : ni liste, ni suggestion, ni petite construction ; la sauvegarde ne change pas', () => {
    const mousso = getCommande(MOUSSO)!;
    const cles = casesDeLaPetiteConstruction(mousso.fixture)!.map((c) => c.key);
    const s = etat({ progress: joue(FORET, PLAINE, FERME), stock: { [BLOC.bois]: 3 }, world: { links: [PONT_FERME], place: PLAINE, parts: { [mousso.fixture]: cles }, requests: [COCO] } });
    const vu = sansCommandes(s);
    expect(vu.world.requests).toBeUndefined();
    expect(vu.world.parts[mousso.fixture]).toBeUndefined();
    expect(nextDestination(s).commande).toBe(COCO);
    expect(nextDestination(vu).commande).toBeUndefined();
    // La sauvegarde elle-même n'est pas touchée.
    expect(s.world.requests).toEqual([COCO]);
    // Sans commande ni petite construction, rien à retirer : le même état.
    const sans = etat({ world: { links: [] } });
    expect(sansCommandes(sans)).toBe(sans);
  });
});
