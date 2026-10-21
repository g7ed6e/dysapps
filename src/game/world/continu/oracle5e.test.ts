// L'Oracle (GD-22, lot 13b) : le lieu par parties (le corps, le haut, les abords ; en grec, tant que l'alphabet attend
// sa police, le haut et les abords ensemble), la ruine qui part avec l'étape qui la remplace, une seule lanterne allumée
// dans la ruine, une trace par rang de mission, la même en latin et en grec, le signe de l'absence (l'empreinte du miroir,
// son trou et ses quatre goujons aux coins), la paroi basse, les panneaux peints jamais saturés au soleil, le parvis sans
// marche, rien de la ruine sur le chemin de marche, le porche sans estrade, le cercle ouvert au sud, la scénette dans
// l'abri et la natte dans son cadre, le conteur en modèle 3D, ses abords dans le cadre, les lampes des réponses, le cap de
// « Y aller » (la paroi entière et la tour du Donjon au-dessus), les plafonds de 1 600 et 1 200 triangles et le budget du
// 5e. Sans Three.js.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { FOREST_REWORK_MAX_5E, PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { followPose, lookUp, screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { arrivalViewOf, doorViewOf } from './northShore';
import { ORACLE, ORACLE_LAYOUT, ORACLE_RANKS } from './oracle5e';
import { ORACLE_SURROUNDINGS } from './oracleSurroundings';
import { RIBBON_LIFT } from './paths';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { rendered5e } from './rendered5e';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { LIGHT_5E } from './sky';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'oracle')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_5E.oracle];
const LATIN = MISSIONS.filter((m) => m.startsWith('la-'));
const GREEK = MISSIONS.filter((m) => m.startsWith('gr-'));

/** Les parties de l'option : le réglage en mémoire décide (./parts.ts). */
function shapesOf(lca: 'la' | 'gr'): PartShape[] {
  retenirReglages({ ...DEFAULT_SETTINGS, lca });
  return partShapes(ISLAND);
}
afterEach(() => retenirReglages(null));

/** La ruine de l'Oracle au plus (intention du directeur artistique, « Le budget »). */
const ORACLE_RUIN_MAX = 1_200;

const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ces parties posées : la ruine qui reste, les étapes posées. */
function shown(parts: readonly PartShape[]): Facets {
  return drawPieces('oracle', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les `n` premières parties du latin (0 : la ruine, 3 : tout). */
const latin = (n: number): PartShape[] => shapesOf('la').slice(0, n);

/** Les sommets d'une couleur exacte. */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Le plus haut d'un dessin, depuis le sol du centre du lieu. */
const topOf = (f: Facets): number => Math.max(...f.positions.filter((_, i) => i % 3 === 1));

/** La distance d'un point au segment [a, b]. */
function toSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('L’Oracle, lieu complet', () => {
  it('ses six missions, trois par option, se jouent dans sa scénette : trois parties en latin, deux en grec (le haut et les abords ensemble)', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(LATIN).toEqual(['la-founding', 'la-gods', 'la-cases']);
    expect(GREEK).toEqual(['gr-founding', 'gr-gods', 'gr-alphabet']);
    expect(hasScenette('oracle')).toBe(true);
    expect(partiesDe(ISLAND, 'la')).toHaveLength(3);
    expect(partiesDe(ISLAND, 'gr')).toHaveLength(2);
    expect(shapesOf('la').map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(shapesOf('gr').map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([
      [[0, 0, 1]],
      [
        [1, 0, 1],
        [2, 0, 1],
      ],
    ]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec l’étape qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(latin(n)).triangles, String(n)).not.toBe(shown(latin(n - 1)).triangles);
    const fallen = placePieces('oracle')
      .filter((p) => p.stage === 'ruine' && p.until)
      .map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    // En grec, la deuxième partie pose le haut et les abords : le lieu restauré, le même qu'en latin.
    expect(shown(shapesOf('gr')).triangles).toBe(shown(latin(3)).triangles);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises, dans chaque option ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (const [lca, done] of [
      ['la', LATIN],
      ['gr', GREEK],
    ] as const) {
      const shapes = shapesOf(lca);
      for (let n = 0; n <= shapes.length; n++) {
        const traces = placeTrace('oracle', posedTraces('oracle', shapes.slice(0, n), done)).triangles;
        worst = Math.max(worst, shown(shapes.slice(0, n)).triangles + traces);
      }
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown([]).triangles).toBeLessThanOrEqual(ORACLE_RUIN_MAX);
    // Le plus chargé est le lieu restauré, toutes les traces posées : le budget le compte ainsi.
    expect(shown(latin(3)).triangles + placeTrace('oracle', MISSIONS).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle du conteur ; le haut allume celle du porche, les abords celle du parvis', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(latin(n)), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(1)).toBe(30);
    expect(lit(2)).toBe(60);
    expect(lit(3)).toBe(90);
  });

  it('le signe de l’absence ne change jamais : l’empreinte du miroir, son trou dans son tiers haut, ses goujons aux quatre coins', () => {
    // Parmi ce qui reste toujours, seul le trou a le brun très sombre : un aplat à huit pans, six triangles ; l'empreinte,
    // un aplat de la teinte de la roche, à peine moins passée (deux triangles), étroit : de loin, seul le trou est sombre.
    expect(countColor(ruinOf('oracle'), 0x3a312c)).toBe(18);
    expect(countColor(ruinOf('oracle'), 0x939890)).toBe(6);
    const Q = ORACLE_LAYOUT.mark;
    expect(Q.mark).toBeCloseTo(0.28, 2);
    expect(Q.markH).toBeCloseTo(0.56, 2);
    expect(Q.y - Q.markH / 2).toBeGreaterThan(0.8);
    // Le trou dans le tiers haut de l'empreinte, jamais au milieu.
    expect(Q.hole - Q.r).toBeGreaterThan(Q.markH / 6 - 0.05);
    expect(Q.hole + Q.r).toBeLessThan(Q.markH / 2);
    const [dx, dy] = [Q.mark / 2 - Q.inset, Q.markH / 2 - Q.inset];
    for (const sy of [-1, 1]) expect(Math.hypot(dx, sy * dy - Q.hole) - Q.stud).toBeGreaterThan(Q.r);
    // À droite de la bouche, plus loin que la perche du conteur.
    expect(ORACLE_LAYOUT.fronts.east[0][0]).toBe(ORACLE_LAYOUT.abri.x1);
  });

  it('la paroi basse : 4,5 au plus au-dessus du sol de l’abri, la bouche de 6 sur 3,4, profonde de 5', () => {
    const above = topOf(shown(latin(3))) - ORACLE_LAYOUT.abriFloor;
    expect(above).toBeLessThanOrEqual(ORACLE_LAYOUT.wallTop + 0.36 + 1e-6);
    for (const rock of Object.values(ORACLE_LAYOUT.rocks)) for (const t of rock.tops) expect(t).toBeLessThanOrEqual(ORACLE_LAYOUT.wallTop);
    const A = ORACLE_LAYOUT.abri;
    expect(A.x1 - A.x0).toBe(6);
    expect(A.high).toBeCloseTo(3.4, 6);
    expect(A.z1 - A.z0).toBe(5);
  });

  it('les panneaux peints, sourds : aucune face au soleil, rendue sous la lumière du 5e, plus vive que la brique du Donjon (#A8664F)', () => {
    // La vivacité, l'écart entre le plus fort et le plus faible des trois canaux : la saturation HSL s'emballe près du
    // blanc (une crème presque grise y passerait pour vive), l'écart non.
    const chroma = (c: number) => (Math.max((c >> 16) & 255, (c >> 8) & 255, c & 255) - Math.min((c >> 16) & 255, (c >> 8) & 255, c & 255)) / 255;
    const bound = chroma(0xa8664f);
    const sun = LIGHT_5E.sunFrom;
    const seen = new Map<string, number>();
    for (const [palette, f] of [
      [ORACLE_LAYOUT.paint.lively, shown(latin(1))],
      [ORACLE_LAYOUT.paint.pale, shown([])],
    ] as const) {
      const paints = Object.values(palette).map((c) => linearRgb(c));
      for (let i = 0; i < f.positions.length; i += 3) {
        const color = [f.colors[i], f.colors[i + 1], f.colors[i + 2]];
        const n = [f.normals[i], f.normals[i + 1], f.normals[i + 2]];
        if (!paints.some((c) => c.every((v, k) => Math.abs(v - color[k]) < 1e-4)) || n[0] * sun.x + n[1] * sun.y + n[2] * sun.z <= 0) continue;
        const shownColor = rendered5e(color, n);
        seen.set(shownColor.toString(16), shownColor);
      }
    }
    // Le fond (vers le sud) et le retour ouest (vers l'est) prennent le soleil, dans les quatre couleurs.
    expect(seen.size).toBeGreaterThan(6);
    for (const s of seen.values()) expect(chroma(s), s.toString(16)).toBeLessThanOrEqual(bound + 1e-3);
    // La terre de sienne reste une terre : le rouge devant le bleu.
    const sienna = rendered5e(linearRgb(ORACLE_LAYOUT.paint.lively.sienna), [0, 0, 1]);
    expect(sienna >> 16).toBeGreaterThan((sienna & 0xff) + 0x30);
  });

  it('le parvis, sans marche : à moins de 0,03 du disque de la chaussée à la porte, une tranche de 0,1 au plus à son bord sud', () => {
    const c = PLACE.center;
    const H0 = ORACLE_LAYOUT.heightAtCenter;
    const g = (x: number, z: number) => standingHeight(heightAt5e({ x: c.x + x, z: c.z + z })) - H0;
    const door = ORACLE_LAYOUT.door;
    const node = g(door.x, door.z) + RIBBON_LIFT;
    const P = ORACLE_LAYOUT.parvis;
    expect(Math.abs(ORACLE_LAYOUT.parvisAt(door.x, P.z1) - node)).toBeLessThanOrEqual(0.03);
    for (let x = P.x0; x <= P.x1 + 1e-6; x += 0.5) {
      for (const z of [P.z0, (P.z0 + P.z1) / 2, P.z1]) expect(ORACLE_LAYOUT.parvisAt(x, z) - g(x, z), `${x} ${z}`).toBeGreaterThan(0);
      expect(ORACLE_LAYOUT.parvisAt(x, P.z1) - g(x, P.z1), String(x)).toBeLessThanOrEqual(0.1);
    }
  });

  it('rien de la ruine sur le chemin de marche, d’`aig-2` à la porte', () => {
    const c = PLACE.center;
    const node = PATH_NODES_5E.find((n) => n.id === 'aig-2')!.at;
    const from = { x: node.x - c.x, z: node.z - c.z };
    const door = ORACLE_LAYOUT.door;
    const ruin = drawPieces('oracle', (p) => p.stage === 'ruine');
    for (let i = 0; i < ruin.positions.length; i += 3) {
      const p = { x: ruin.positions[i], z: ruin.positions[i + 2] };
      const y = ruin.positions[i + 1] - ORACLE_LAYOUT.parvisAt(p.x, p.z);
      if (y < 0.2 || y > 2) continue;
      expect(toSegment(p, from, door), `${p.x.toFixed(2)} ${p.z.toFixed(2)}`).toBeGreaterThan(0.9);
    }
  });

  it('le porche sans estrade : aucun dessus du haut à moins de 2 au-dessus du sol ; ses montants plantés dans le sol du seuil', () => {
    const f = drawPieces('oracle', (p) => p.stage === 1);
    for (let i = 0; i < f.positions.length; i += 3) {
      if (f.normals[i + 1] < 0.9) continue;
      const [x, y, z] = [f.positions[i], f.positions[i + 1], f.positions[i + 2]];
      expect(y - ORACLE_LAYOUT.parvisAt(x, z), `${x.toFixed(2)} ${z.toFixed(2)}`).toBeGreaterThan(2);
    }
    const P = ORACLE_LAYOUT.porch;
    expect(P.span).toBeGreaterThan(ORACLE_LAYOUT.abri.x1 - ORACLE_LAYOUT.abri.x0);
    expect(P.z).toBeGreaterThan(ORACLE_LAYOUT.abri.z1);
  });

  it('le cercle des conteurs, en fer à cheval ouvert au sud, à l’écart de la chaussée qui arrive de l’est', () => {
    const K = ORACLE_LAYOUT.circle;
    expect(K.seats).toHaveLength(6);
    for (const deg of K.seats) expect(Math.abs(deg)).toBeLessThanOrEqual(100);
    expect(K.x + K.r).toBeLessThan(ORACLE_LAYOUT.door.x - 2);
    // Deux sièges couchés dans la ruine, jamais côte à côte.
    expect(K.fallen).toHaveLength(2);
    expect(Math.abs(K.fallen[1] - K.fallen[0])).toBeGreaterThan(1);
  });
});

describe('Les traces de l’Oracle : une par rang de mission, la même en latin et en grec', () => {
  it('la natte au corps, le coffre au haut, la cruche aux abords ; la même trace pour la-<rang> et gr-<rang>', () => {
    expect(Object.keys(ORACLE.traces).sort()).toEqual([...MISSIONS].sort());
    for (const [la, gr] of Object.values(ORACLE_RANKS)) expect(ORACLE.traces[gr], la).toBe(ORACLE.traces[la]);
    expect(LATIN.map((m) => [ORACLE.traces[m].stage, ORACLE.traces[m].row ?? 0])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
  });

  it('la trace d’une mission se montre quand sa mission est réussie et que son étape est posée, dans chaque option', () => {
    for (let n = 0; n <= 3; n++) expect(posedTraces('oracle', latin(n), LATIN), String(n)).toEqual(LATIN.slice(0, n));
    // En grec, la deuxième partie pose le haut et les abords : le coffre et la cruche ensemble.
    const gr = shapesOf('gr');
    expect(posedTraces('oracle', gr.slice(0, 1), GREEK)).toEqual(['gr-founding']);
    expect(posedTraces('oracle', gr, GREEK)).toEqual(GREEK);
    expect(posedTraces('oracle', [WHOLE], MISSIONS)).toEqual(MISSIONS);
    expect(posedTraces('oracle', latin(1), ['la-gods'])).toEqual([]);
    expect(traceStagePosed('oracle', latin(1))).toBe(true);
    expect(traceStagePosed('oracle', latin(0))).toBe(false);
  });

  it('chaque trace se dessine seule ; une trace réussie dans les deux options se dessine une fois', () => {
    for (const m of MISSIONS) expect(placeTrace('oracle', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('oracle', []).triangles).toBe(0);
    expect(placeTrace('oracle', MISSIONS).triangles).toBe(placeTrace('oracle', LATIN).triangles);
  });
});

describe('La scénette de l’Oracle', () => {
  it('le conteur, sans prénom, à droite ; Kéo à gauche, à plus de deux unités de lui, sur le sol de l’abri', () => {
    expect(scenetteOf('oracle').role).toBe('Le conteur');
    expect(scenetteOf('oracle').greeting).toBe('Le conteur raconte les légendes.');
    const keo = scenetteKeo('oracle').at;
    const h = scenetteHabitant('oracle');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('oracle');
    expect(s.z - PLACE.center.z).toBeCloseTo(ORACLE_LAYOUT.scene.dz, 6);
    // Le sol de la scène est le sol de l'abri.
    expect(keo.y).toBeCloseTo(ORACLE_LAYOUT.heightAtCenter + ORACLE_LAYOUT.parvisAt(ORACLE_LAYOUT.scene.dx, ORACLE_LAYOUT.scene.dz), 2);
    const items = placeItems('oracle', 'lca-5e-legends-la-founding-1', [{ key: 'a', choices: ['oui', 'non'], answer: 'oui' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
    expect(ORACLE.answer).toBeDefined();
  });

  it('ses abords, le rocher à l’ouest et le buisson à l’est, dans le cadre à 1024 × 768', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('oracle', stage, w, h);
    const floor = sceneSpot('oracle');
    const { rock, bush } = ORACLE_SURROUNDINGS;
    for (const [dx, dz] of [
      [rock.dx - rock.r, rock.dz],
      [rock.dx + rock.r, rock.dz],
      [bush.dx - bush.s, bush.dz],
      [bush.dx + bush.s, bush.dz],
    ]) {
      const p = screenOf(pose, { x: floor.x + dx, y: floor.y + 0.3, z: floor.z + dz }, w, h);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeGreaterThan(stage.left);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeLessThan(stage.right);
    }
  });

  it('la natte reste dans le cadre de la scénette, entre Kéo et le conteur, derrière eux, à 1024 × 768', () => {
    expect(ORACLE.keepsTracesInScenette).toBe(true);
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('oracle', stage, w, h);
    const c = PLACE.center;
    const H0 = ORACLE_LAYOUT.heightAtCenter;
    const at = ORACLE.traces['la-founding'].at;
    const s = (x: number, y: number, z: number) => {
      const p = screenOf(pose, { x, y, z }, w, h);
      return { x: p.x - shift.x, y: p.y - shift.y };
    };
    const y = H0 + ORACLE_LAYOUT.parvisAt(at.x, at.z);
    const keo = scenetteKeo('oracle').at;
    const teller = scenetteHabitant('oracle');
    for (const p of [s(c.x + at.x - 0.75, y, c.z + at.z), s(c.x + at.x + 0.75, y, c.z + at.z)]) {
      expect(p.x).toBeGreaterThan(stage.left);
      expect(p.x).toBeLessThan(stage.right);
      expect(p.y).toBeGreaterThan(stage.top);
      expect(p.y).toBeLessThan(stage.bottom);
    }
    expect(c.x + at.x).toBeGreaterThan(keo.x);
    expect(c.x + at.x).toBeLessThan(teller.x);
    expect(c.z + at.z).toBeLessThan(keo.z);
  });

  it('une lampe choisie se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('oracle', at, 1, { picked: [] });
    const picked = answerObjects('oracle', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    expect(topOf(picked) - topOf(still)).toBeGreaterThan(0.15);
  });

  it('le conteur se montre en modèle 3D', () => {
    expect(hasHabitantModel('oracle')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('oracle', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('ne dit ni l’option ni un nom du contenu (ni Rome, ni la Grèce, ni la Lyre, ni le Phénix)', () => {
    const said = `${scenetteOf('oracle').role} ${scenetteOf('oracle').greeting ?? ''}`;
    expect(said).not.toMatch(/Lyre|Phénix|Rome|Grèce|latin|grec|Passeurs|oracle/i);
  });
});

describe('Le bilan de l’Oracle nomme la partie par son étape', () => {
  it('« Partie posée : le corps de l’Oracle. », puis le haut et les abords ; jamais le nom d’un plan', () => {
    retenirReglages({ ...DEFAULT_SETTINGS, lca: 'la' });
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(3);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toMatch(/^Partie posée : le corps de l’Oracle/);
    expect(said(1)).toMatch(/^Partie posée : le haut de l’Oracle/);
    expect(said(2)).toMatch(/^Partie posée : les abords de l’Oracle/);
    for (let k = 0; k < 3; k++)
      for (const plan of plansFor(ISLAND)) {
        expect(said(k)).not.toContain(plan.done);
        expect(said(k)).not.toContain(plan.name);
      }
  });
});

describe('« Y aller » à l’Oracle', () => {
  const c = PLACE.center;
  const H0 = ORACLE_LAYOUT.heightAtCenter;
  const view = arrivalViewOf('oracle')!;
  const world = (x: number, y: number, z: number) => ({
    x: c.x + x,
    y: H0 + y,
    z: c.z + z,
  });
  const door = { x: c.x + ORACLE_LAYOUT.door.x, z: c.z + ORACLE_LAYOUT.door.z };
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };

  it('Kéo à la porte, sur la chaussée ; la caméra presque de face, recule comme au Donjon, le regard levé à la tour du Donjon', () => {
    // Tournée vers l'ouest, vers la bouche, de moins de 15° : la paroi reste de face.
    expect(doorViewOf('oracle')).toBeGreaterThan(0);
    expect(doorViewOf('oracle')).toBeLessThan((15 * Math.PI) / 180);
    expect(PATH_NODES_5E.find((n) => n.id === 'oracle')!.at).toEqual(door);
    expect(view.back).toBeGreaterThan(1);
    expect(view.back).toBeLessThanOrEqual(1.6);
    expect(view.top).toBe(ORACLE_LAYOUT.donjonTower.top);
  });

  // Le cadre ne dépend pas de ce qui est posé : le regard se lève toujours au haut de la tour du Donjon.
  for (const [W, H] of [
    [1024, 768],
    [390, 844],
  ])
    it(`en ${W} × ${H} : le haut de la tour du Donjon sous 40 px de ciel, la bouche, Kéo haut de 70 px au moins${W > H ? ', la paroi entière' : ''}`, () => {
      // Comme la vue : la caméra qui suit, reculée, puis le regard levé jusqu'au haut de la tour du Donjon.
      const pose = followPose(feet, 0, undefined, doorViewOf('oracle'), 1, undefined, { height: 0, back: view.back });
      lookUp(pose, world(view.look.x, view.top!, view.look.z), feet, 1, H);
      const s = (p: { x: number; y: number; z: number }) => screenOf(pose, p, W, H);
      const inFrame = (p: { x: number; y: number }, what: string, sky = 0) => {
        expect(p.x, what).toBeGreaterThan(0);
        expect(p.x, what).toBeLessThan(W);
        expect(p.y, what).toBeGreaterThan(sky);
        expect(p.y, what).toBeLessThan(H);
      };
      inFrame(s(world(view.look.x, view.top!, view.look.z)), 'tour', 40);
      // La tour au-dessus de la paroi : son haut plus haut à l'écran que le haut de la voûte.
      const A = ORACLE_LAYOUT.abri;
      const Y = ORACLE_LAYOUT.abriFloor;
      expect(s(world(view.look.x, view.top!, view.look.z)).y).toBeLessThan(s(world(0, Y + ORACLE_LAYOUT.wallTop, A.z1)).y);
      // La bouche entière : ses deux pieds et le haut de l'arche.
      for (const x of [A.x0, A.x1]) inFrame(s(world(x, Y, A.z1)), `bouche ${x}`);
      inFrame(s(world(0, Y + A.high, A.z1)), 'arche');
      // Kéo, haut de 70 px au moins, ses pieds au-dessus de « Y aller ».
      const foot = s(feet);
      expect(foot.y - s({ ...feet, y: feet.y + 2.4 }).y).toBeGreaterThanOrEqual(70);
      expect(foot.y).toBeLessThan(H - 72);
      if (W < H) return;
      // La paroi entière, d'un bout à l'autre, à son haut.
      const R = ORACLE_LAYOUT.rocks;
      for (const [[x, z], t, what] of [
        [R.west.corners[0], R.west.tops[0], 'ouest'],
        [R.east.corners[2], R.east.tops[2], 'est'],
      ] as const)
        inFrame(s(world(x, Y + t, z)), `paroi ${what}`);
    });
});

/** Le budget du 5e au lot 13a, avec les chaussées et le Donjon (`npm run rendu:budget -- --archipel 6e,5e`), scénette ouverte. */
const LOT13A_OPEN_5E = { triangles: 103_939, calls: 19 } as const;

describe('Le budget du 5e, avec l’Oracle (plafonds du lot 13b)', () => {
  it('scénette ouverte : le lot 13a et un lieu de plus au plus par lieu fini depuis, sans appel de plus ; le conteur dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    // Les lieux finis depuis le lot 13a : l'Oracle (lot 13b), puis le Sémaphore (lot 14) ; et la forêt retaillée (#490).
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => !['montee', 'hameau', 'radeaux', 'croisee', 'instants', 'fumerolles', 'etuve', 'terrasses', 'auberge', 'donjon'].includes(id)).length;
    expect(since).toBeGreaterThanOrEqual(1);
    expect(triangles).toBeLessThanOrEqual(LOT13A_OPEN_5E.triangles + since * PLACE_TRIANGLES_MAX_5E + FOREST_REWORK_MAX_5E);
    expect(calls).toBeLessThanOrEqual(LOT13A_OPEN_5E.calls);
    expect(cost.find((c) => c.poste === 'scénette')!.calls).toBe(2);
  });
});
