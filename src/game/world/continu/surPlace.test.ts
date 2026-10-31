import { describe, expect, it } from 'vitest';
import { heightAt, standingHeight } from './terrain';
import { openWorldCost } from './budget';
import { respondTriangles } from './respond';
import { placeById } from './levelPlan';
import { questionLayout } from './questionScene';
import { isItemScene, placeInstruction, placeItems, SUR_PLACE_OBJECTS, surPlaceLast, COLUMN } from './questions';
import { scenetteLayout } from './scenette';
import { playsSurPlace, surPlaceOf } from './paroles';
import { SUR_PLACE_CAMERA, SUR_PLACE_OBJECT_TRIANGLES, SUR_PLACE_OBJECT_WIDTH, SUR_PLACE_STONE_TRIANGLES, SUR_PLACE_TRIANGLES_MAX, hasSurPlaceStation, surPlaceFacets, surPlaceObject, surPlacePose, surPlaceSite, surPlaceStation, surPlaceStone, type SurPlaceScene } from './surPlace';
import { boundsOf } from './facets';
import livingGroups from '../../exercises/data/life-earth-sciences-6e-living-world-living-groups-1.json';
import type { QuestionItem } from './questions';

const ground = (x: number, z: number) => standingHeight(heightAt({ x, z }));
const LEVEL = 'life-earth-sciences-6e-living-world-living-groups-1';
const items = livingGroups.items as unknown as QuestionItem[];

describe('l’épreuve hors des murs (GD-27, lot 6) : le kit, la station, la caméra', () => {
  it('chaque objet du kit tient en 40 à 80 triangles, une pierre en 12, la scène entière sous le plafond', () => {
    for (const name of SUR_PLACE_OBJECTS) {
      const t = surPlaceObject(name).triangles;
      expect(t, name).toBeGreaterThanOrEqual(SUR_PLACE_OBJECT_TRIANGLES.min);
      expect(t, name).toBeLessThanOrEqual(SUR_PLACE_OBJECT_TRIANGLES.max);
      // En gris, la même silhouette : autant de triangles.
      expect(surPlaceObject(name, { x: 0, y: 0, z: 0 }, true).triangles).toBe(t);
    }
    expect(surPlaceStone({ x: 0, y: 0, z: 0 }).triangles).toBe(SUR_PLACE_STONE_TRIANGLES);
    const site = surPlaceSite('mangrove', ground)!;
    const worst = Math.max(
      ...[
        ['aigrette', 'chauve-souris', 'araignée'],
        ['poisson', 'libellule', 'aigrette'],
        ['araignée', 'poisson', 'chauve-souris'],
      ].map((objects) => surPlaceFacets(site, { kind: 'surPlace', objects: objects as never }, { answered: false, right: [], picked: [] }).facets.triangles),
    );
    expect(worst).toBeLessThanOrEqual(SUR_PLACE_TRIANGLES_MAX);
    expect(SUR_PLACE_TRIANGLES_MAX).toBe(276);
    // Dans le poste « question » du budget du monde, qui compte déjà la scène la plus lourde : aucune hausse, aucun appel de plus.
    expect(openWorldCost(0).find((c) => c.poste === 'question')!.triangles).toBeGreaterThanOrEqual(SUR_PLACE_TRIANGLES_MAX);
    // Avec les propagules toutes posées (le monde qui répond, vu depuis la station) : sous la somme des postes de
    // l'item et de la scénette, qui ne se montre pas à la station.
    const postes = openWorldCost(0);
    const question = postes.find((c) => c.poste === 'question')!.triangles;
    const scenette = postes.find((c) => c.poste === 'scénette')!.triangles;
    expect(SUR_PLACE_TRIANGLES_MAX + respondTriangles('mangrove')).toBeLessThanOrEqual(question + scenette);
  });

  it('la station de la Mangrove est hors de la boîte du lieu, sur un sol plat ; ses trois pierres du nord au sud, Kéo au tiers gauche', () => {
    expect(hasSurPlaceStation('mangrove')).toBe(true);
    expect(hasSurPlaceStation('phare')).toBe(false);
    expect(surPlaceStation('phare')).toBeNull();
    const at = surPlaceStation('mangrove')!;
    const c = placeById('mangrove').center;
    expect(Math.hypot(at.x - c.x, at.z - c.z)).toBeGreaterThan(6);
    const site = surPlaceSite('mangrove', ground)!;
    expect(site.stones).toHaveLength(3);
    expect(site.stones.map((s) => s.z)).toEqual([at.z - 1.4, at.z, at.z + 1.4]);
    expect(site.stones.every((s) => s.x === at.x)).toBe(true);
    // Un sol presque plat : les trois pierres à la même hauteur, à trois dixièmes près, au-dessus de l'eau.
    const ys = site.stones.map((s) => s.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.3);
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(site.keo.at.x).toBeGreaterThan(at.x);
    expect(Math.abs(site.keo.at.z - at.z)).toBeGreaterThan(1);
    // Kéo tourné vers l'objet du milieu, au cap de la scène (`atan2(-dx, -dz)` vers ce qu'il regarde).
    const d = { x: at.x - site.keo.at.x, z: at.z - site.keo.at.z };
    expect(site.keo.yaw).toBeCloseTo(Math.atan2(-d.x, -d.z), 6);
  });

  it('chaque objet du kit tient dans une unité de large, de gauche à droite comme de près en loin, posé sur sa pierre', () => {
    for (const name of SUR_PLACE_OBJECTS) {
      const { min, max } = boundsOf(surPlaceObject(name));
      expect(max[2] - min[2], name).toBeLessThanOrEqual(SUR_PLACE_OBJECT_WIDTH);
      expect(max[0] - min[0], name).toBeLessThanOrEqual(SUR_PLACE_OBJECT_WIDTH);
      // Posé sur sa pierre, rien ne s'enfonce.
      expect(min[1], name).toBeGreaterThanOrEqual(-0.001);
    }
    // Chaque objet a son dessin (`surPlaceObject` les connaît tous, par leur type) ; le kit du lecteur du contenu est
    // comparé à celui-ci dans scripts/contenu/aulieu.test.mjs.
  });

  it('la caméra fixe : à l’ouest, le regard vers l’est, l’œil entre 1,8 et 2,2 au-dessus du sol, à cinq unités et demie de l’objet du milieu, en plongée de quinze degrés ; le point visé au même endroit de l’écran quelle que soit la bulle', () => {
    const site = surPlaceSite('mangrove', ground)!;
    const [w, h] = [1024, 768];
    const base = questionLayout({ count: 3 }, w, h);
    const layout = scenetteLayout({ count: 3 }, w, h, base);
    const { pose, shift } = surPlacePose(site, w, h);
    const mid = site.stones[1];
    expect(pose.position.x).toBeLessThan(mid.x);
    expect(pose.position.z).toBeCloseTo(mid.z, 6);
    const d = Math.hypot(pose.position.x - pose.target.x, pose.position.y - pose.target.y, pose.position.z - pose.target.z);
    expect(d).toBeCloseTo(SUR_PLACE_CAMERA.distance, 6);
    expect(d).toBeGreaterThanOrEqual(5);
    expect(d).toBeLessThanOrEqual(6);
    const eye = pose.position.y - site.floor.y;
    expect(eye).toBeGreaterThanOrEqual(1.8);
    expect(eye).toBeLessThanOrEqual(2.2);
    const pitch = Math.atan2(pose.position.y - pose.target.y, pose.position.x - pose.target.x < 0 ? pose.target.x - pose.position.x : 1);
    expect((pitch * 180) / Math.PI).toBeGreaterThanOrEqual(15);
    expect((pitch * 180) / Math.PI).toBeLessThanOrEqual(20);
    // Le point visé un peu à droite du milieu (le rappel à gauche), aux deux tiers de la hauteur, sans égard à la bulle.
    expect(shift.x).toBeCloseTo(w * (0.5 - SUR_PLACE_CAMERA.across), 6);
    expect(shift.y).toBeCloseTo(h * (0.5 - SUR_PLACE_CAMERA.down), 6);
    expect(layout.scenette.stage).toBeDefined();
  });

  it('après la bonne réponse, la bonne reste seule ; un essai écarté reste en gris ; les pierres ne changent jamais', () => {
    const site = surPlaceSite('mangrove', ground)!;
    const scene: SurPlaceScene = { kind: 'surPlace', objects: ['aigrette', 'chauve-souris', 'libellule'] };
    const open = surPlaceFacets(site, scene, { answered: false, right: [], picked: [] });
    expect(open.anchors.every((a) => a !== null)).toBe(true);
    const tried = surPlaceFacets(site, scene, { answered: false, right: [], picked: [0] });
    expect(tried.facets.triangles).toBe(open.facets.triangles);
    const won = surPlaceFacets(site, scene, { answered: true, right: [1], picked: [0] });
    expect(won.anchors.map((a) => a !== null)).toEqual([false, true, false]);
    expect(won.facets.triangles).toBe(3 * SUR_PLACE_STONE_TRIANGLES + surPlaceObject('chauve-souris').triangles);
    // L'étiquette au-dessus de l'objet, sur sa pierre.
    expect(won.anchors[1]!.top.y).toBeGreaterThan(site.stones[1].y);
    expect(won.anchors[1]!.top.x).toBeCloseTo(site.stones[1].x, 1);
  });
});

describe('les jumeaux de la Mangrove joués sur place', () => {
  it('le niveau 1 de « Classer le vivant » : quatre jumeaux à trois objets, quatre items en scénette ; le niveau 2 et la révision en scénette', () => {
    expect(surPlaceOf('mangrove')).toEqual({ mission: 'living-groups', level: 1, go: 'Va voir les animaux de la rive.', instruction: 'Touche le bon animal.' });
    expect(playsSurPlace('mangrove', LEVEL)).toBe(true);
    expect(playsSurPlace('mangrove', 'life-earth-sciences-6e-living-world-living-groups-2')).toBe(false);
    const placed = placeItems('mangrove', LEVEL, items);
    const kinds = placed.map((p) => p.placeScene.kind);
    expect(kinds.filter((k) => k === 'surPlace')).toHaveLength(4);
    expect(kinds.filter((k) => k === 'column')).toHaveLength(4);
    // Le jumeau porte la clé de sa référence, sa phrase, et ses objets dans l'ordre des choix.
    const first = placed[0];
    expect(first.key).toBe(`${LEVEL}-0`);
    expect(first.prompt).toBe('Un animal a des ailes et des poils. C’est un …');
    expect(first.choices).toEqual(['oiseau', 'mammifère', 'insecte']);
    expect(first.placeScene).toEqual({ kind: 'surPlace', objects: ['aigrette', 'chauve-souris', 'libellule'] });
    expect(isItemScene(first.placeScene)).toBe(true);
    expect((first.aid as { props: { lines: string[] } }).props.lines).toEqual(['On classe selon ce que les êtres vivants ont : leurs attributs.']);
    expect(first).not.toHaveProperty('point');
    // Le geste « ranger » de la référence reste à la scénette : sur place, on touche.
    expect(first).not.toHaveProperty('gesture');
    expect(first).not.toHaveProperty('subject');
    // Les items sans jumeau gardent leur item de référence.
    expect(placed[3].prompt).toBe(items[3].prompt);
    // En révision, tout en scénette, l'item de référence tel quel.
    const revision = placeItems('mangrove', LEVEL, items, undefined, false, false);
    expect(revision.every((p) => p.placeScene.kind === 'column')).toBe(true);
    expect(revision[0].prompt).toBe(items[0].prompt);
    expect(placeInstruction('mangrove', LEVEL, 1, 'Référence.', first.placeScene)).toBe('Touche le bon animal.');
    expect(placeInstruction('mangrove', LEVEL, 1, 'Référence.', COLUMN)).toBe('Référence.');
  });

  it('les écrans : la scénette d’abord, puis les items sur place, chaque groupe dans l’ordre reçu', () => {
    const placed = placeItems('mangrove', LEVEL, items);
    const screens = surPlaceLast([...placed].reverse().map((p) => [p]));
    expect(screens.map((s) => s[0].placeScene.kind)).toEqual(['column', 'column', 'column', 'column', 'surPlace', 'surPlace', 'surPlace', 'surPlace']);
    expect(screens.slice(4).map((s) => s[0].key.slice(-1))).toEqual(['4', '2', '1', '0']);
    expect(surPlaceLast([[placed[3]], [placed[5]]]).map((s) => s[0].key)).toEqual([placed[3].key, placed[5].key]);
  });

  it('une scène sur place mal formée est refusée', () => {
    expect(isItemScene({ kind: 'surPlace', objects: [] })).toBe(false);
    expect(isItemScene({ kind: 'surPlace', objects: ['aigrette', 'aigrette'] })).toBe(false);
    expect(isItemScene({ kind: 'surPlace', objects: ['manchot'] })).toBe(false);
    expect(isItemScene({ kind: 'surPlace', objects: ['aigrette', 'poisson', 'araignée', 'libellule'] })).toBe(false);
  });
});
