// Les liaisons du monde continu lues dans la grille (GD-20, point 3, lot 1 « Relier ») : chaque lieu à relier a sa
// liaison de la grille, au prix du 6e, depuis un lieu ouvert au départ (posée, ou à reposer si la grille ne la trace pas) ;
// un lieu fermé s'ouvre quand sa liaison est posée, ou quand l'élève y a déjà joué.
import { describe, expect, it } from 'vitest';
import '../../world/linkGeometry';
import { LINK_PRICE, buildBridge, buildUntracedLink, linkLength, reachableIslands } from '../../world/archipelago';
import { markForRelink, linksToRelink } from '../../world/arrange';
import { PLACE_LINKS, isLinked, type LinkedPlace } from '../../world/continu/links';
import type { MissionMark } from '../../world/continu/mission';
import { PLACES, placeById } from '../../world/continu/plan6e';
import { linkOfPlace, openWorldLinks } from './placeLinks';
import { BLOC } from '../../biomes';
import { EMPTY_STATE } from '../../engine';

const linked = PLACES.map((p) => p.id).filter(isLinked);
const rich = { [BLOC.pierre]: 20 };

/**
 * Les liaisons de la table que la disposition de départ de la grille ne trace pas : la Turbine, le Chantier naval, la
 * Vigie et les Archives sont loin des Quais dans la grille. Reliées dans le monde continu, elles sont à reposer dans la
 * grille (GD-9) dès leur pose. Ce test dit la liste : qu'elle change, et la règle se relit.
 */
const UNTRACED: readonly string[] = ['engine', 'shipyard', 'lookout', 'archives'];

describe('Chaque lieu à relier a sa liaison de la grille', () => {
  it.each(linked)('%s : la liaison existe, coûte 4, part d’un lieu ouvert au départ et ouvre le lieu', (place) => {
    const b = linkOfPlace(place)!;
    expect(b, place).toBeDefined();
    expect(b.cost).toBe(LINK_PRICE['6e']);
    const open = reachableIslands([]);
    const from = placeById(PLACE_LINKS[place as LinkedPlace]).island;
    expect(open.has(from as never)).toBe(true);
    expect([b.from, b.to]).toContain(placeById(place).island);
    expect(open.has(placeById(place).island as never)).toBe(false);
    // Payée, elle ouvre le lieu : par `buildBridge` si elle se trace dans la disposition de départ, sinon posée « à
    // reposer » (`buildUntracedLink`, puis `markForRelink`).
    const traced = linkLength(b, []) !== null;
    expect(traced, place).toBe(!UNTRACED.includes(place));
    const r = traced ? buildBridge(b.id, [], rich) : buildUntracedLink(b.id, [], rich);
    expect(r.ok).toBe(true);
    if (r.ok) expect(reachableIslands(r.bridges).has(placeById(place).island as never)).toBe(true);
    if (traced) expect(buildUntracedLink(b.id, [], rich)).toEqual({ ok: false, reason: 'loin' });
    else expect(buildBridge(b.id, [], rich)).toEqual({ ok: false, reason: 'loin' });
  });

  it('les lieux du départ n’ont pas de liaison', () => {
    expect(linkOfPlace('phare')).toBeNull();
    expect(linkOfPlace('quais')).toBeNull();
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
