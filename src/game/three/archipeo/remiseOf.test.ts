// La commande d'un habitant vue par le monde ouvert (GD-20, point 4, lot L1) : chaque commande du 6e a sa remise, son
// lieu, son aménagement, un élément par ressource ; les seize phrases de fin accordées ; la ligne de l'habitant (prête,
// ou ce qui manque et où aller) ; les pastilles ; et la livraison, celle de la grille, sans rien de neuf dans la
// sauvegarde.
import { describe, expect, it } from 'vitest';
import { sanitizeState } from '../../engine';
import { amenagementById } from '../../world/continu/amenagements';
import { COMMANDES, livrerLaCommande } from '../../world/requests';
import { posedAmenagements } from './amenagements';
import { MAX_SIGNS, commandLines, habitantLineOf, habitantSigns, placeOfCommande, remiseOf, sourceOf } from './remiseOf';

const COMMANDES_6E = COMMANDES.filter((c) => amenagementById(c.fixture));
const ESCALE = 'Le Chantier de l’Escale';
const etat = (raw: Record<string, unknown>) => sanitizeState(raw);
const byPlace = (place: string) => COMMANDES_6E.find((c) => placeOfCommande(c) === place)!;

describe('La remise de chaque commande du 6e', () => {
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

  it('les seize phrases de fin, accordées au genre de « Les demandes »', () => {
    expect(Object.fromEntries(COMMANDES_6E.map((c) => [placeOfCommande(c), remiseOf(c.id)!.done]))).toEqual({
      phare: 'Le potager est posé.',
      printworks: 'Le puits est posé.',
      archives: 'La grue est posée.',
      filets: 'Le bac à eau est posé.',
      lookout: 'Le poteau-lanterne est posé.',
      quais: 'La boutique est posée.',
      ecluses: 'Le lavoir est posé.',
      saltworks: 'Le parasol est posé.',
      beacons: 'La pendule est posée.',
      ferry: 'La vitrine est posée.',
      ruins: 'Le tamis est posé.',
      observatory: 'La placette est posée.',
      mangrove: 'Le nichoir est posé.',
      engine: 'L’étagère à flacons est posée.',
      shipyard: 'L’établi est posé.',
      commons: 'L’urne est posée.',
    });
  });
});

describe('La ligne de l’habitant', () => {
  const potager = byPlace('phare');

  it('rien tant que la commande n’est pas arrivée, ni une fois livrée', () => {
    expect(habitantLineOf(etat({ stock: { [potager.block]: 9 }, world: { links: [] } }), 'phare', ESCALE)).toBeNull();
    const arrivee = etat({ stock: { [potager.block]: 9 }, world: { links: [], requests: [potager.id] } });
    const livree = livrerLaCommande(arrivee, potager.id);
    expect(livree.ok && habitantLineOf(livree.state, 'phare', ESCALE)).toBeNull();
  });

  it('prête : le lieu de l’habitant dans la phrase, « Livrer »', () => {
    const s = etat({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } });
    expect(habitantLineOf(s, 'phare', ESCALE)).toEqual({ kind: 'livrer', commande: potager.id, role: 'La gardienne du phare', text: expect.stringMatching(/^Livre les \d .+ au Phare\.$/) });
  });

  it('il manque des blocs : la demande, le lieu de la ressource, « Y aller » y mène', () => {
    const s = etat({ stock: {}, world: { links: [], requests: [potager.id] } });
    const line = habitantLineOf(s, 'phare', ESCALE);
    expect(line?.kind).toBe('manque');
    const go = sourceOf(potager);
    expect(go && 'place' in go).toBe(true);
    expect(line).toMatchObject({ go });
    expect(line?.text).toMatch(/^Il me faut \d .+ pour le potager\. Joue une mission (au|à la|à l’|aux) .+\.$/);
  });

  it('un bloc assemblé : le lieu où l’on assemble, à l’Escale', () => {
    const assemblee = COMMANDES_6E.find((c) => sourceOf(c) && 'port' in sourceOf(c)!);
    expect(assemblee).toBeDefined();
    const place = placeOfCommande(assemblee!)!;
    const line = habitantLineOf(etat({ stock: {}, world: { links: [], requests: [assemblee!.id] } }), place, ESCALE);
    expect(line).toMatchObject({ kind: 'manque', go: { port: 'chantier' } });
    expect(line?.text).toMatch(/Assemble les .+ au Chantier de l’Escale\.$/);
  });

  it('la liste « Commandes » : les commandes ouvertes, dans l’ordre d’arrivée', () => {
    const [a, b] = [byPlace('quais'), byPlace('phare')];
    const s = etat({ stock: { [b.block]: b.count }, world: { links: [], requests: [a.id, b.id] } });
    expect(commandLines(s, ESCALE).map((l) => [l.place, l.line.kind])).toEqual([
      ['quais', 'manque'],
      ['phare', 'livrer'],
    ]);
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
