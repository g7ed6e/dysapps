// La commande d'un habitant vue par le monde ouvert (GD-20, point 4, lot L1) : chaque commande du 6e a sa remise, son
// lieu, son aménagement, un élément par ressource ; les seize phrases de fin ; chaque forme remplie avec les seize
// commandes (le plafond de mots compté sur le texte écrit, ni « à le » ni accolade) ; la ligne de l'habitant (prête, ou
// ce qui manque et où aller) ; la commande prête dans la suggestion ; les pastilles ; et la livraison, celle de la grille,
// sans rien de neuf dans la sauvegarde.
import { describe, expect, it } from 'vitest';
import { frenchTypography } from '../../../components/math/RichText';
import { sanitizeState } from '../../engine';
import { lieuDAssemblage } from '../../world/assembly';
import { amenagementById } from '../../world/continu/amenagements';
import { PLACES } from '../../world/continu/plan6e';
import { HABITANT_PHRASES, filled, remiseDuration, voiceFallbackMs, type HabitantPhrases } from '../../world/continu/remise';
import { COMMANDES, livrerLaCommande } from '../../world/requests';
import { posedAmenagements } from './amenagements';
import { MAX_SIGNS, commandLines, habitantLineOf, habitantSigns, placeOfCommande, readyCommande, remiseOf, sourceOf, suggestedCommande, tokensOf } from './remiseOf';

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
      expect(r!.amenagement).toBe(c.fixture);
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
    expect(suggestedCommande(ready, false)).toBe(ready);
    expect(suggestedCommande(ready, true)).toBeNull();
    expect(suggestedCommande(null, false)).toBeNull();
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
