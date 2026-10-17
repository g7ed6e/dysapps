// Les liaisons du monde continu lues dans la grille (GD-20, point 3, lot 1 « Relier ») : chaque lieu à relier a sa
// liaison de la grille, au prix du 6e, depuis un lieu ouvert au départ ou, pour quatre d'entre eux, depuis un voisin relié ;
// un lieu fermé s'ouvre quand sa liaison est posée, ou quand l'élève y a déjà joué.
import { describe, expect, it } from 'vitest';
import '../../world/linkGeometry';
import { LINK_PRICE, buildBridge, buildUntracedLink, getBridge, linkLength, reachableIslands } from '../../world/archipelago';
import { markForRelink, linksToRelink } from '../../world/arrange';
import { AFTER_NEIGHBOUR, PLACE_LINKS, isLinked, linksFromStart } from '../../world/continu/links';
import type { MissionMark } from '../../world/continu/mission';
import { PLACES, placeById, type PlaceId } from '../../world/continu/plan6e';
import { linkOfPlace, linkToPay, neighboursFirst, openWorldLinks, payableLink } from './placeLinks';
import { BLOC } from '../../biomes';
import { EMPTY_STATE } from '../../engine';

const linked = PLACES.map((p) => p.id).filter(isLinked);
const rich = { [BLOC.pierre]: 20 };

const between = (a: PlaceId, b: PlaceId) => getBridge(`${placeById(a).island}-${placeById(b).island}`) ?? getBridge(`${placeById(b).island}-${placeById(a).island}`)!;
const other = (bridge: { from: string; to: string }, place: PlaceId) => PLACES.find((p) => p.island === (bridge.from === placeById(place).island ? bridge.to : bridge.from))?.id;

describe('Chaque lieu de la table a sa liaison de la grille', () => {
  it.each(linked.filter(linksFromStart))('%s : la liaison existe, coûte 4, part d’un lieu ouvert au départ, se trace et ouvre le lieu', (place) => {
    const b = linkOfPlace(place)!;
    expect(b, place).toBeDefined();
    expect(b.cost).toBe(LINK_PRICE['6e']);
    const open = reachableIslands([]);
    expect(open.has(placeById(PLACE_LINKS[place]).island as never)).toBe(true);
    expect([b.from, b.to]).toContain(placeById(place).island);
    expect(open.has(placeById(place).island as never)).toBe(false);
    expect(linkLength(b, [])).not.toBeNull();
    expect(linkToPay(place, [])).toBe(b);
    const r = buildBridge(b.id, [], rich);
    expect(r.ok).toBe(true);
    if (r.ok) expect(reachableIslands(r.bridges).has(placeById(place).island as never)).toBe(true);
    expect(buildUntracedLink(b.id, [], rich)).toEqual({ ok: false, reason: 'loin' });
  });

  it('les lieux du départ n’ont pas de liaison', () => {
    expect(linkOfPlace('phare')).toBeNull();
    expect(linkOfPlace('quais')).toBeNull();
  });
});

describe('Après un voisin (choix du mainteneur, 17 octobre 2026)', () => {
  it('leur liaison depuis les Quais ne se trace pas dans la disposition de départ', () => {
    for (const place of AFTER_NEIGHBOUR) expect(linkLength(between('quais', place), []), place).toBeNull();
  });

  it('comme la grille : la Vigie et les Archives se relient dès le départ depuis le Phare, d’où leur liaison se trace ; la Turbine et le Chantier naval attendent un voisin', () => {
    for (const place of ['lookout', 'archives'] as const) {
      const b = linkToPay(place, [])!;
      expect(other(b, place), place).toBe('phare');
      expect(b.cost).toBe(LINK_PRICE['6e']);
      expect(buildBridge(b.id, [], rich).ok).toBe(true);
    }
    expect(linkToPay('engine', [])).toBeNull();
    expect(linkToPay('shipyard', [])).toBeNull();
    expect(openWorldLinks([], []).waiting).toEqual(['engine', 'shipyard']);
  });

  it('le voisin relié, le lieu devient reliable par la liaison de la grille qui se trace depuis lui, même identifiant, même prix', () => {
    const ecluses = linkOfPlace('ecluses')!.id;
    const b = linkToPay('engine', [ecluses])!;
    expect(b).toBe(between('ecluses', 'engine'));
    expect(b.cost).toBe(LINK_PRICE['6e']);
    expect(openWorldLinks([ecluses], []).waiting).not.toContain('engine');
    const r = buildBridge(b.id, [ecluses], rich);
    expect(r.ok).toBe(true);
    if (r.ok) expect(reachableIslands(r.bridges).has(placeById('engine').island as never)).toBe(true);
    // Le Chantier naval, après les Filets.
    expect(other(linkToPay('shipyard', [linkOfPlace('filets')!.id])!, 'shipyard')).toBe('filets');
  });

  it('le voisin à relier d’abord : un lieu fermé d’où la liaison se trace, le plus proche de Kéo d’abord', () => {
    const closed = openWorldLinks([], []).closed;
    const near = (p: PlaceId) => placeById(p).center;
    expect(neighboursFirst('engine', [], closed, near('ecluses'))[0]).toBe('ecluses');
    expect(neighboursFirst('engine', [], closed, near('printworks'))[0]).toBe('printworks');
    expect(neighboursFirst('engine', [], closed, near('engine')).sort()).toEqual(['ecluses', 'printworks']);
  });

  it('la suggestion ne choisit jamais un lieu pas encore reliable', () => {
    const id = between('ecluses', 'engine').id;
    expect(openWorldLinks([], [], id).suggested).toBeNull();
    expect(openWorldLinks([linkOfPlace('ecluses')!.id], [], id).suggested).toBe('engine');
  });

  it('une sauvegarde d’avant les liaisons, ses voisins joués sans être reliés : le lieu reste reliable, par une liaison à reposer', () => {
    const bornes: MissionMark[] = [
      { ile: placeById('ecluses').island, mission: 'number-line', etat: 1 },
      { ile: placeById('printworks').island, mission: 'x', etat: 1 },
    ];
    expect(openWorldLinks([], bornes).waiting).not.toContain('engine');
    const b = payableLink('engine', [])!;
    expect(buildUntracedLink(b.id, [], rich).ok).toBe(true);
  });
});

describe('Les lieux fermés et la liaison suggérée', () => {
  it('au départ, les quatorze lieux à relier sont fermés ; une liaison posée en ouvre un', () => {
    expect(openWorldLinks([], []).closed).toEqual(linked);
    const b = linkOfPlace('filets')!;
    expect(openWorldLinks([b.id], []).closed).not.toContain('filets');
    expect(openWorldLinks([b.id], []).closed).toHaveLength(13);
  });

  it('un lieu déjà joué dans le monde ouvert reste ouvert, sans liaison payée ni rien d’écrit dans la sauvegarde', () => {
    const bornes: MissionMark[] = [{ ile: placeById('ecluses').island, mission: 'number-line', etat: 1 }];
    expect(openWorldLinks([], bornes).closed).not.toContain('ecluses');
    expect(openWorldLinks([], [{ ...bornes[0], etat: 'new' }]).closed).toContain('ecluses');
  });

  it('la liaison suggérée : celle que propose la prochaine destination, si son lieu est fermé', () => {
    const b = linkOfPlace('mangrove')!;
    expect(openWorldLinks([], [], b.id).suggested).toBe('mangrove');
    expect(openWorldLinks([b.id], [], b.id).suggested).toBeNull();
    expect(openWorldLinks([], []).suggested).toBeNull();
  });
});

describe('Relier quand la grille aménagée ne trace plus la liaison (GD-9)', () => {
  it('markForRelink : la liaison devient à reposer, une seule fois', () => {
    const b = linkOfPlace('filets')!;
    const world = markForRelink(EMPTY_STATE.world, b.id);
    expect(linksToRelink(world, '6e')).toEqual([b.id]);
    expect(linksToRelink(markForRelink(world, b.id), '6e')).toEqual([b.id]);
    expect(markForRelink(EMPTY_STATE.world, 'inconnue')).toBe(EMPTY_STATE.world);
  });
});
