import { BIOMES } from '../biomes';
import { EMPTY_STATE } from '../engine';
import type { VillagePlaceId } from './cube';
import { BRIDGES, getArchipelago, islandsOf } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipels';
import { toutConstruit } from './budget';
import { dispositionEnGrille, dureeDeMarche, WALK_MAX_MS, WALK_SPEED } from './grille';
import { MONUMENTS } from './monuments';
import { walkGround, walkPath } from './paths';
import { walkDuration } from './scene';
import {
  avatarHome,
  avatarRoute,
  bridgePath,
  creaturePlacements,
  guardianPlacements,
  islandAt,
  islandCenter,
  islandOrigin,
  monumentCenter,
  placeDoor,
  questStations,
  routeLengths,
  viewZone,
  worldBounds,
  worldCubes,
} from './terrain';

// La disposition en grille enveloppe les fonctions de la grille sans rien changer à ce qu'elles calculent : chaque
// réponse est comparée au calcul d'avant (celui que faisait la page du monde).

const { progress, village } = toutConstruit();
const grilleDe = (a: (typeof ARCHIPELAGO_IDS)[number]) => {
  const cubes = worldCubes(a, progress, village, false, []);
  const creatures = [...creaturePlacements(a, village.bridges), ...guardianPlacements(a, progress, village.bridges)];
  return { g: dispositionEnGrille(a, village.bridges, { cubes, creatures }), ground: walkGround(cubes, creatures) };
};

describe('La disposition en grille', () => {
  it('les îles : leur centre, où se tient le bonhomme, le cadrage, l’île sous un point, l’étendue', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const g = dispositionEnGrille(a);
      expect(g.etendue()).toEqual(worldBounds(a));
      for (const b of islandsOf(a)) {
        expect(g.versMonde(g.placeDe({ genre: 'ile', id: b.id })!)).toEqual(islandCenter(b.id));
        expect(g.versMonde(g.seTenir(b.id))).toEqual(avatarHome(b.id));
        expect(g.cadrage(b.id)).toEqual(viewZone(b.id));
        for (let dx = -12; dx <= 12; dx += 3)
          for (let dy = -12; dy <= 12; dy += 3) {
            const p = { x: islandCenter(b.id).x + dx + 0.4, y: islandCenter(b.id).y + dy + 0.7, z: 0 };
            expect(g.ileEn(p)).toBe(islandAt(a, Math.floor(p.x), Math.floor(p.y)));
          }
      }
    }
  });

  it('les bornes de mission : la case que calculait la page du monde', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const g = dispositionEnGrille(a);
      for (const b of islandsOf(a)) {
        const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((x) => x.id === b.id));
        for (const st of questStations(b.id))
          expect(g.versMonde(g.placeDe({ genre: 'borne', id: `${b.id}:${st.typeId}` })!)).toEqual({ x: ox + st.x, y: oy + st.y, z: oz });
      }
      expect(g.placeDe({ genre: 'borne', id: 'foret:inconnue' })).toBeNull();
    }
  });

  it('les ouvrages : leur tracé, et leur place au milieu du tracé', () => {
    const g = dispositionEnGrille('6e');
    for (const b of BRIDGES) {
      const path = bridgePath(b);
      expect(g.liaison(b.id)).toEqual(path.map((c) => ({ x: c.x, y: c.y, z: c.z })));
      expect(g.placeDe({ genre: 'ouvrage', id: b.id })).toMatchObject({ ile: b.from });
    }
    expect(g.liaison('inconnu')).toEqual([]);
  });

  it('les monuments : le milieu de leur îlot, dans leur archipel seulement', () => {
    for (const m of MONUMENTS) {
      expect(dispositionEnGrille(m.archipelago).versMonde(dispositionEnGrille(m.archipelago).placeDe({ genre: 'plan', id: m.id })!)).toEqual(monumentCenter(m));
      const ailleurs = ARCHIPELAGO_IDS.find((a) => a !== m.archipelago)!;
      expect(dispositionEnGrille(ailleurs).placeDe({ genre: 'plan', id: m.id })).toBeNull();
    }
  });

  it('les trajets d’île en île : le chemin et la durée d’avant, sur le sol', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { g, ground } = grilleDe(a);
      for (const from of islandsOf(a))
        for (const to of islandsOf(a)) {
          const avant = avatarRoute(from.id, to.id, village.bridges, ground);
          const t = g.trajet({ genre: 'ile', id: from.id }, { genre: 'ile', id: to.id });
          expect(t && t.etapes.map(g.versMonde), `${from.id} → ${to.id}`).toEqual(avant);
          if (t && avant) expect(t.duree).toBe(walkDuration(avant));
        }
    }
    // Sans ouvrage construit, pas de chemin d'une île à l'autre.
    expect(dispositionEnGrille('6e').trajet({ genre: 'ile', id: 'foret' }, { genre: 'ile', id: 'mine' })).toBeNull();
  });

  it('changer de but en chemin : le trajet part de l’île où il se trouve, sans finir de traverser l’ouvrage', () => {
    const a = '6e';
    const { g } = grilleDe(a);
    let essais = 0;
    for (const from of islandsOf(a))
      for (const to of islandsOf(a)) {
        if (from.id === to.id) continue;
        const aller = g.trajet({ genre: 'ile', id: from.id }, { genre: 'ile', id: to.id });
        if (!aller || aller.etapes.length < 4) continue;
        // Juste parti : encore sur l'île de départ. Un toucher le renvoie sur cette île.
        const p = g.versMonde(aller.etapes[1]);
        if (g.ileEn(p) !== from.id) continue;
        const retour = g.trajet({ genre: 'ile', id: g.ileEn(p) }, { genre: 'ile', id: from.id }, { depart: p });
        expect(retour!.etapes.every((e) => e.ile !== to.id), `${from.id} → ${to.id}`).toBe(true);
        // Parti de l'île visée (ce que faisait la page) : il finissait de traverser jusqu'à elle avant de revenir.
        const avant = g.trajet({ genre: 'ile', id: to.id }, { genre: 'ile', id: from.id }, { depart: p });
        expect(avant!.etapes.some((e) => e.ile === to.id)).toBe(true);
        essais++;
      }
    expect(essais).toBeGreaterThan(0);
  });

  it('le trajet jusqu’à la porte d’un lieu du village : celui d’avant', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { g, ground } = grilleDe(a);
      const school = getArchipelago(a).school;
      for (const place of ['ecole', 'trophees', 'assemblage'] as VillagePlaceId[])
        for (const from of islandsOf(a)) {
          const door = placeDoor(place, school);
          const route = avatarRoute(from.id, school, village.bridges, ground);
          if (!route) continue;
          const last = route[route.length - 1];
          const toDoor = door ? (walkPath(ground, last, door) ?? [last, door]) : [last];
          const t = g.trajet({ genre: 'ile', id: from.id }, { genre: 'lieu', id: place, ile: school });
          expect(t!.etapes.map(g.versMonde), `${from.id} → ${place}`).toEqual([...route, ...toDoor.slice(1)]);
          if (door) expect(g.versMonde(g.placeDe({ genre: 'lieu', id: place, ile: school })!)).toEqual(door);
        }
    }
  });

  it('la durée d’une marche : six cases par seconde, six secondes au plus', () => {
    const court = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }];
    expect(dureeDeMarche(court)).toBe((routeLengths(court)[1] / WALK_SPEED) * 1000);
    expect(dureeDeMarche([{ x: 0, y: 0, z: 0 }, { x: 600, y: 0, z: 0 }])).toBe(WALK_MAX_MS);
    expect(dureeDeMarche([court[0]])).toBe(0);
  });

  it('une partie vierge : le bonhomme reste sur son île de départ', () => {
    const g = dispositionEnGrille('6e', EMPTY_STATE.village.bridges);
    expect(g.trajet({ genre: 'ile', id: 'foret' }, { genre: 'ile', id: 'foret' })!.etapes.map(g.versMonde)).toEqual([avatarHome('foret')]);
  });
});
