// Les zones de toucher des objets dans la scène 3D de Blocland, sans WebGL : une borne ou un Gardien petits à l'écran
// se touchent dans un carré de 48 pixels autour d'eux, les autres objets directement ; rien sur la Carte ni pendant le
// voyage. Les bulles sont dessinées par ./signs.ts (signs.test.ts).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { cleDeLObjet, SIGNE, signesDesObjets, zoneDuToucher, type EtatDuSigne, type ObjetTouche, type SigneDObjet, type ToucherDirect } from '../world/affordance';
import { BIOMES } from '../biomes';
import { guardianPlacements, guardianSpot, worldBounds, worldCubes } from '../world/terrain';
import { QUEST_ROW } from '../world/terrain/markers';
import { ARCHIPELAGO_IDS, archipelagoOfIsland } from '../world/archipelagos';
import { linkWholeRegion, VOYAGES } from '../world/archipelago';

import { HABILLAGES } from '../skin';
import { creerAffordance } from './affordance';
import { creerCamera } from './camera';
import type { Derniers, Instant, Monde } from './scenePart';

const FORET: BiomeId = 'french-6e-phonology';

function scene() {
  const monde = { scene: new THREE.Scene() } as unknown as Monde;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  const derniers = { current: { carte: false, focus: { island: FORET, seq: 1 }, home: FORET, forceDay: false, whalePass: null, sons: false } as Derniers };
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const affordance = creerAffordance(derniers, instant);
  return { monde, camera, affordance, derniers, instant };
}

/** Un objet d'un bloc sur le sol, en (x, 0). */
const objet = (o: ObjetTouche, etat: EtatDuSigne, x: number): SigneDObjet => ({
  cle: cleDeLObjet(o),
  objet: o,
  etat,
  x,
  y: 0,
  z: 3,
  iles: [FORET],
  boite: { min: { x: x - 0.5, y: -0.5, z: 1 }, max: { x: x + 0.5, y: 0.5, z: 2.8 } },
});

const OBJETS = [
  objet({ genre: 'borne', id: `${FORET}:a` }, 'aFaire', -4),
  objet({ genre: 'borne', id: `${FORET}:b` }, 'pasEncore', -2),
  objet({ genre: 'gardien', id: FORET }, 'aFaire', 0),
  objet({ genre: 'lieu', id: 'school', ile: FORET }, 'lieu', 4),
];

it('une borne ou un Gardien petits à l’écran ont leur zone de 48 pixels, à faire ou pas ; un lieu se touche directement', () => {
  const { affordance, camera } = scene();
  affordance.poser(OBJETS);
  affordance.animer!(0, 0.016, false);
  const zones = affordance.zones(camera, 1024, 768);
  expect(zones.map((z) => cleDeLObjet(z.objet))).toEqual([`borne:${FORET}:a`, `borne:${FORET}:b`, `gardien:${FORET}`]);
  for (const { zone } of zones) {
    expect(zone.w).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.h).toBeGreaterThanOrEqual(SIGNE.zonePx);
    expect(zone.distance).toBeGreaterThan(0);
  }
  // De tout près, une borne fait plus de 48 pixels : elle se touche directement, sans zone.
  camera.position.set(-4, 3, -3);
  camera.lookAt(-4, 2, 0);
  expect(affordance.zones(camera, 1024, 768).some((z) => cleDeLObjet(z.objet) === `borne:${FORET}:a`)).toBe(false);
  // Rien n'est dessiné ici : les bulles sont dans ./signs.ts.
  expect(scene().monde.scene.children).toHaveLength(0);
});

it('aucune zone sur la Carte ni pendant le voyage', () => {
  const { affordance, derniers, instant, camera } = scene();
  affordance.poser(OBJETS);
  derniers.current.carte = true;
  affordance.animer!(1, 0.016, false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
  derniers.current.carte = false;
  instant.navigue = { at: new THREE.Vector3(), k: 0.5, stage: 1 };
  affordance.animer!(1, 0.016, false);
  expect(affordance.zones(camera, 1024, 768)).toEqual([]);
});

it('le Golem de roche : un Gardien à faire, sa bulle au-dessus de sa tête', () => {
  const ile: BiomeId = 'french-6e-letter-confusion';
  const golem = guardianPlacements('6e', {}, ['french-6e-phonology-french-6e-letter-confusion'], true).find((g) => g.id === ile)!;
  const [s] = signesDesObjets({ cubes: [], creatures: [golem] });
  expect(s).toMatchObject({ etat: 'aFaire', objet: { genre: 'gardien', id: ile } });
  expect(s.z).toBeCloseTo(golem.origin.z + Math.max(...golem.cubes.map((c) => c.z)) + 1 + SIGNE.auDessus, 6);
});

it('au téléphone (390 × 844), toucher à côté de la borne la plus proche du Gardien ouvre la borne, pas le Gardien', () => {
  // Les îles où le Gardien se tient sur un côté de la bande de devant (GD-11), près des bornes : le Belvédère de Thalès
  // (le Sphinx de marbre), et les autres (world/terrain.test.ts les nomme ; ni la Mine des lettres ni la Tour du lecteur
  // depuis que le chemin du bonhomme depuis ses arrivées écarte les côtés ; le Hangar des inventions, l'Imprimerie des
  // révolutions et le Verger de la santé depuis le seuil de 75 %, neuf îles). Mesuré le 8 octobre 2026 : aucun de ces
  // Gardiens ne fait moins de 48 pixels au téléphone, il n'a pas de zone ; là où une zone de Gardien chevauche celle
  // d'une borne, la borne gagne (`zoneRetenue`, world/affordance.test.ts).
  const liens = [...new Set([...ARCHIPELAGO_IDS.flatMap((a) => linkWholeRegion(a, VOYAGES.map((v) => v.id))), ...VOYAGES.map((v) => v.id)])];
  const taille = { w: 390, h: 844 };
  for (const ile of BIOMES.filter((b) => guardianSpot(b.id).y <= QUEST_ROW + 1).map((b) => b.id)) {
    const a = archipelagoOfIsland(ile);
    const cubes = worldCubes(a, {}, { parts: {}, log: [], links: liens }, false);
    const quests = [...new Set(cubes.filter((c) => c.quest && c.tag === ile).map((c) => c.quest!))].map((id) => ({ id, state: 'new' as const }));
    const creatures = guardianPlacements(a, {}, liens, true, [], HABILLAGES.blocland.echelleDesGardiens).filter((g) => g.id === ile);
    const b = worldBounds(a);
    const monde: Monde = {
      scene: new THREE.Scene(),
      archipel: a,
      habillage: HABILLAGES.blocland,
      surface: null,
      etendue: b,
      centre: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
      largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY),
      liaisons: () => [],
    };
    const camera = new THREE.PerspectiveCamera(40, taille.w / taille.h, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: ile, seq: 1 }, home: ile, forceDay: true, whalePass: undefined, sons: false } as unknown as Derniers };
    const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
    creerCamera(monde, camera, new THREE.Object3D(), derniers, instant).cadrer(derniers.current.focus, false, ile);
    camera.updateMatrixWorld();
    const affordance = creerAffordance(derniers, instant);
    affordance.poser(signesDesObjets({ cubes, quests, creatures }));
    affordance.animer!(0, 0.016, false);
    const zones = affordance.zones(camera, taille.w, taille.h);
    const bornes = zones.filter((z) => z.objet.genre === 'borne');
    expect(bornes.length, ile).toBeGreaterThan(0);
    // Le Gardien (sa zone s'il est petit à l'écran, sinon le milieu de la boîte de son signe).
    const sienne = zones.find((z) => z.objet.genre === 'gardien');
    const centre = sienne?.zone ?? (() => {
      const g = creatures[0];
      const xs = g.cubes.map((c) => g.origin.x + c.x);
      const ys = g.cubes.map((c) => g.origin.y + c.y);
      const v = new THREE.Vector3((Math.min(...xs) + Math.max(...xs) + 1) / 2, g.origin.z + 1, (Math.min(...ys) + Math.max(...ys) + 1) / 2).project(camera);
      return { x: ((v.x + 1) / 2) * taille.w, y: ((1 - v.y) / 2) * taille.h };
    })();
    // La borne la plus proche du Gardien, à l'écran.
    const proche = bornes.reduce((m, z) => (Math.hypot(z.zone.x - centre.x, z.zone.y - centre.y) < Math.hypot(m.zone.x - centre.x, m.zone.y - centre.y) ? z : m));
    const z = proche.zone;
    // Partout dans la zone de la borne, au doigt levé dans le vide ou sur le sol tout près d'elle, une borne gagne (elle,
    // ou sa voisine dont la zone chevauche la sienne), jamais le Gardien : même au bord de sa zone tourné vers lui, là
    // où les deux zones peuvent se chevaucher. En son milieu, c'est elle.
    const lesZones = zones.map((q) => q.zone);
    const sol: ToucherDirect = { genre: 'sol', case: { x: Math.floor((z.boite.min.x + z.boite.max.x) / 2), y: Math.floor((z.boite.min.y + z.boite.max.y) / 2) }, distance: z.distance + 1 };
    for (const direct of [null, sol]) expect(zones[zoneDuToucher(direct, lesZones, z)]?.objet, ile).toBe(proche.objet);
    for (let i = -4; i <= 4; i++)
      for (let j = -4; j <= 4; j++) {
        const doigt = { x: z.x + (i / 4) * (z.w / 2 - 0.5), y: z.y + (j / 4) * (z.h / 2 - 0.5) };
        for (const direct of [null, sol]) expect(zones[zoneDuToucher(direct, lesZones, doigt)]?.objet.genre, `${ile} ${doigt.x}, ${doigt.y}`).toBe('borne');
      }
  }
});
