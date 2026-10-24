// La Carte des lieux ouverts du monde continu (piste 1, lot 3) : l'île entière à l'ouverture, glisser et pincer dans
// leurs limites, la pose de la caméra (nord en haut). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { markOffset, screenOf } from './camera';
import type { Vec3 } from './geometry';
import { MAP_BAR_ROOM, MAP_EDGE, MAP_PIN_CLEAR, islandBox, MAP_CAMERA, grown, MAP_COMPACT, MAP_KEO_DISC, MAP_LABEL_GAP, MAP_LOCK, MAP_REFRAME, clampMap, fitDistance, layoutMapLabels, mapFarPlane, mapLabelSide, mapPose, mapStart, panMap, reframeMap, zoomMap, type MapLabel, type MapLabelSpot, type MapView, type Rect } from './map';
import { PLACES, placeById } from './plan6e';
import { PORT_MAP_POINT } from './port';
import { heightAt, standingHeight } from './terrain';
import { planFor } from './levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');

const screens = [
  [1024, 768],
  [768, 1024],
  [844, 390],
  [667, 375],
] as const;

describe('La Carte des lieux ouverts', () => {
  it('s’ouvre sur l’île entière : les six lieux et les bords de l’île à l’écran, nord en haut', () => {
    for (const [w, h] of screens) {
      const pose = mapPose(mapStart(PLAN, w / h));
      const at = `${w}×${h}`;
      for (const p of PLACES) {
        const s = screenOf(pose, { x: p.center.x, y: 0, z: p.center.z }, w, h);
        expect(s.x, at).toBeGreaterThan(0);
        expect(s.x, at).toBeLessThan(w);
        expect(s.y, at).toBeGreaterThan(0);
        expect(s.y, at).toBeLessThan(h);
      }
      const { minX, maxX, minZ, maxZ } = islandBox(PLAN);
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const west = screenOf(pose, { x: minX, y: 0, z: cz }, w, h);
      const east = screenOf(pose, { x: maxX, y: 0, z: cz }, w, h);
      const north = screenOf(pose, { x: cx, y: 0, z: minZ }, w, h);
      const south = screenOf(pose, { x: cx, y: 0, z: maxZ }, w, h);
      expect(west.x, at).toBeGreaterThanOrEqual(-1);
      expect(east.x, at).toBeLessThanOrEqual(w + 1);
      expect(north.y, at).toBeGreaterThanOrEqual(-1);
      expect(south.y, at).toBeLessThanOrEqual(h + 1);
      // Le nord en haut de l'écran.
      expect(north.y).toBeLessThan(south.y);
      expect(west.x).toBeLessThan(east.x);
    }
  });

  it('se pince entre la plus proche et l’île entière, autour du point sous les doigts', () => {
    const aspect = 1024 / 768;
    const start = mapStart(PLAN, aspect);
    const toward = PLACES[0].center;
    const near = zoomMap(PLAN, start, 2, toward, aspect);
    expect(near.distance).toBeCloseTo(start.distance / 2, 6);
    // Le point sous les doigts se rapproche du milieu, à la même part.
    expect(near.x - toward.x).toBeCloseTo((start.x - toward.x) / 2, 6);
    expect(zoomMap(PLAN, start, 1000, toward, aspect).distance).toBe(MAP_CAMERA.closest);
    expect(zoomMap(PLAN, start, 0.001, toward, aspect).distance).toBeCloseTo(fitDistance(PLAN, aspect), 6);
  });

  it('se glisse sans quitter l’île', () => {
    const aspect = 844 / 390;
    const start = mapStart(PLAN, aspect);
    const moved = panMap(PLAN, start, 10, -5, aspect);
    expect(moved.x).toBeCloseTo(start.x + 10, 6);
    expect(moved.z).toBeCloseTo(start.z - 5, 6);
    const far = panMap(PLAN, start, 1e4, -1e4, aspect);
    expect(far.x).toBe(islandBox(PLAN).maxX);
    expect(far.z).toBe(islandBox(PLAN).minZ);
    expect(clampMap(PLAN, far, aspect)).toEqual(far);
  });

  it('au plus grand texte, la vue de départ change jusqu’à ce que chaque lieu ouvert ait son nom (GD-20, « La Carte au plus grand texte »)', () => {
    const aspect = 667 / 375;
    const start = mapStart(PLAN, aspect);
    const open = [PLACES[0].center, PLACES[1].center];
    // Rien ne manque : l'île entière, sans rien essayer d'autre (le texte normal ne change pas).
    let tried = 0;
    expect(reframeMap(PLAN, aspect, open, () => (tried++, 0))).toEqual(start);
    expect(tried).toBe(1);
    // Il manque un nom à l'île entière, plus rien un peu plus loin : la vue la plus proche de l'île entière qui suffit.
    const farther = reframeMap(PLAN, aspect, open, (v) => (v.distance > start.distance * 1.15 ? 0 : 100));
    expect(farther.distance).toBeGreaterThan(start.distance * 1.15);
    expect(farther.distance).toBeLessThan(start.distance * 1.15 * MAP_REFRAME.step + 1e-6);
    // Plus près, centrée sur les lieux ouverts.
    const closer = reframeMap(PLAN, aspect, open, (v) => (v.distance < start.distance / 1.3 ? 0 : 100));
    expect(closer.distance).toBeLessThan(start.distance / 1.3);
    expect(closer.distance).toBeGreaterThanOrEqual(start.distance / MAP_REFRAME.most - 1e-6);
    expect(closer.x).toBeCloseTo((Math.min(open[0].x, open[1].x) + Math.max(open[0].x, open[1].x)) / 2, 6);
    // Rien ne suffit : celle à qui il manque le moins, la plus proche de l'île entière ; jamais au-delà de la portée.
    const seen: MapView[] = [];
    const best = reframeMap(PLAN, aspect, open, (v) => (seen.push(v), v.distance > start.distance * 1.5 ? 10 : 100));
    expect(best.distance).toBeGreaterThan(start.distance * 1.5);
    expect(best.distance).toBeLessThan(start.distance * 1.5 * MAP_REFRAME.step + 1e-6);
    for (const v of seen) {
      expect(v.distance).toBeLessThanOrEqual(start.distance * MAP_REFRAME.most + 1e-6);
      expect(v.distance).toBeGreaterThanOrEqual(start.distance / MAP_REFRAME.most - 1e-6);
    }
  });

  it('reculée, la Carte garde sa distance la plus lointaine au glisser et au pincer', () => {
    const aspect = 844 / 390;
    const fit = fitDistance(PLAN, aspect);
    const back = { ...mapStart(PLAN, aspect), distance: fit * 1.4 };
    expect(clampMap(PLAN, back, aspect).distance).toBeCloseTo(fit, 6);
    expect(clampMap(PLAN, back, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    expect(panMap(PLAN, back, 5, 0, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    expect(zoomMap(PLAN, back, 0.5, back, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    // Une distance la plus lointaine plus proche que l'île entière ne l'empêche pas de se voir entière.
    expect(clampMap(PLAN, back, aspect, fit / 2).distance).toBeCloseTo(fit, 6);
  });
});

describe('La bande des côtés de la Carte (pistes UX du 24 octobre 2026)', () => {
  it('une part de la largeur, 100 px au plus : au téléphone en portrait, la Carte garde plus de 300 px sur 390 pour ses lieux', () => {
    expect(mapLabelSide(390)).toBe(39);
    expect(390 - 2 * mapLabelSide(390)).toBeGreaterThan(300);
    expect(mapLabelSide(800)).toBe(80);
    // En paysage, sur la tablette et l'ordinateur, la bande d'avant.
    expect(mapLabelSide(1024)).toBe(100);
    expect(mapLabelSide(1920)).toBe(100);
  });
});

describe('Les étiquettes de la Carte', () => {
  const boxOf = (l: MapLabel, s: MapLabelSpot) => {
    if (l.kind === 'closed' && !s.name) return { left: l.x - MAP_LOCK / 2, top: s.top, right: l.x + MAP_LOCK / 2, bottom: s.top + MAP_LOCK };
    if (l.kind === 'keo' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_KEO_DISC, bottom: s.top + l.h };
    if (l.kind === 'keo' && s.toi === 'dessous') return { left: s.left, top: s.top, right: s.left + l.stacked!.w, bottom: s.top + l.stacked!.h };
    if (l.kind === 'open' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    if (l.kind === 'closed') {
      // Le cadenas, et son nom dessous, glissé de `shift`.
      const name = s.left + (s.shift ?? 0);
      return { left: Math.min(name, l.x - MAP_LOCK / 2), top: s.top, right: Math.max(name + l.w, l.x + MAP_LOCK / 2), bottom: s.top + l.h };
    }
    return { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h };
  };
  const apart = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) =>
    a.right + MAP_LABEL_GAP <= b.left || b.right + MAP_LABEL_GAP <= a.left || a.bottom + MAP_LABEL_GAP <= b.top || b.bottom + MAP_LABEL_GAP <= a.top;

  it('un lieu du bas au pied d’un plateau (le 5e) pose son nom d’abord sous lui, les autres au-dessus', () => {
    const screen = { width: 800, height: 360 };
    const at = { x: 400, y: 150, w: 200, h: 48 };
    const [low] = layoutMapLabels([{ id: 'montee', kind: 'open', ...at, below: true }], [], screen);
    const [high] = layoutMapLabels([{ id: 'montee', kind: 'open', ...at }], [], screen);
    expect(low.top).toBeGreaterThan(at.y);
    expect(high.top + at.h).toBeLessThanOrEqual(at.y);
  });

  it('un lieu dont le repère est au sud, sur l’eau (les Radeaux), garde son nom au-dessus, même Kéo devant sa porte', () => {
    const screen = { width: 800, height: 360 };
    const at = { x: 400, y: 200, w: 200, h: 48 };
    // Les radeaux sous le point, que les étiquettes laissent à découvert, comme un bouton.
    const rafts = { left: 380, top: 205, right: 440, bottom: 240 };
    const [alone] = layoutMapLabels([{ id: 'radeaux', kind: 'open', ...at, above: true }], [rafts], screen);
    expect(alone.top + at.h).toBeLessThanOrEqual(at.y);
    // Kéo devant la porte, juste au-dessus du point : le nom reste au-dessus de lui, à côté, jamais au sud des radeaux.
    const spots = layoutMapLabels([{ id: 'keo', kind: 'keo', x: 405, y: 190, w: MAP_KEO_DISC, h: 44 }, { id: 'radeaux', kind: 'open', ...at, above: true }], [rafts], screen);
    const name = spots.find((s) => s.id === 'radeaux')!;
    expect(name.name).toBe(true);
    expect(name.top + at.h).toBeLessThanOrEqual(at.y);
    const box = { left: name.left, top: name.top, right: name.left + at.w, bottom: name.top + at.h };
    expect(box.right <= rafts.left || box.left >= rafts.right || box.bottom <= rafts.top || box.top >= rafts.bottom).toBe(true);
  });

  it('aucun nom de lieu n’en recouvre un autre, dans l’écran et hors des boutons ; Kéo devant son lieu ne déplace aucun nom de lieu ouvert', () => {
    const screen = { width: 844, height: 390 };
    const retour = { left: 20, top: 286, right: 200, bottom: 366 };
    // Au plus grand texte sur téléphone : Kéo devant le Phare, trois lieux fermés serrés.
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 410, y: 208, w: 158, h: 64 },
      { id: 'phare', kind: 'open', x: 400, y: 196, w: 190, h: 130 },
      { id: 'quais', kind: 'closed', x: 489, y: 278, w: 280, h: 110 },
      { id: 'filets', kind: 'closed', x: 469, y: 84, w: 260, h: 110 },
      { id: 'ecluses', kind: 'closed', x: 535, y: 140, w: 300, h: 110 },
    ];
    const spots = layoutMapLabels(labels, [retour], screen);
    const boxes = labels.map((l, i) => boxOf(l, spots[i]));
    // Le nom du Phare, posé sans tenir compte de Kéo (une place fixe par étiquette, chantier de la Carte) ; les noms des
    // terres fermées, posés après la pastille de Kéo, l'évitent (piste B ; sans la reprise, qui peut garder à l'une d'elles
    // une place que le Phare laisse).
    expect(layoutMapLabels(labels.slice(1), [retour], screen, false)[0]).toEqual(layoutMapLabels(labels, [retour], screen, false)[1]);
    for (let i = 1; i < boxes.length; i++) expect(apart(boxes[i], retour), labels[i].id).toBe(true);
    // Le nom du Phare ne touche aucune autre étiquette (les noms des lieux fermés, posés en dernier, l'évitent).
    for (let j = 2; j < boxes.length; j++) expect(apart(boxes[1], boxes[j]), `phare ${labels[j].id}`).toBe(true);
    // Kéo (« Toi » ou sa pastille seule) dans l'écran, hors des boutons, des cadenas et des noms montrés des terres ; au
    // pire à cheval sur le bord du nom de son lieu, le Phare, jamais au milieu.
    expect(apart(boxes[0], retour)).toBe(true);
    const cx = spots[0].left + MAP_KEO_DISC / 2,
      cy = spots[0].top + labels[0].h / 2;
    expect(cx > boxes[1].left && cx < boxes[1].right && cy > boxes[1].top && cy < boxes[1].bottom).toBe(false);
    for (let j = 2; j < boxes.length; j++) if (spots[j].name) expect(apart(boxes[0], boxes[j]), labels[j].id).toBe(true);
    for (const l of labels.slice(2)) expect(apart(boxes[0], { left: l.x - MAP_LOCK / 2, top: l.y - MAP_LOCK, right: l.x + MAP_LOCK / 2, bottom: l.y }), l.id).toBe(true);
    const phare = boxes[1];
    expect(phare.left).toBeGreaterThanOrEqual(MAP_EDGE);
    expect(phare.top).toBeGreaterThanOrEqual(MAP_EDGE);
    // Le cadenas d'un lieu fermé reste toujours ; son nom se tait s'il gêne.
    expect(spots[2].top).toBe(278 - MAP_LOCK);
  });

  it('téléphone couché au plus grand texte : six lieux ouverts serrés, chacun son nom entier sur une ligne ou son icône, jamais sur la colonne ni l’un sur l’autre (piste B)', () => {
    const screen = { width: 667, height: 375 };
    // La bande de gauche réservée (72 px), « Retour » en bas à gauche, Réglages en haut à droite.
    const zones = [
      { left: 0, top: 0, right: 72, bottom: 375 },
      { left: 10, top: 280, right: 130, bottom: 365 },
      { left: 600, top: 10, right: 657, bottom: 66 },
    ];
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 300, y: 240, w: 120, h: 50 },
      { id: 'phare', kind: 'open', x: 120, y: 150, w: 210, h: 56 },
      { id: 'quais', kind: 'open', x: 330, y: 230, w: 210, h: 56 },
      { id: 'filets', kind: 'open', x: 300, y: 120, w: 220, h: 56 },
      { id: 'ecluses', kind: 'open', x: 420, y: 110, w: 250, h: 56 },
      { id: 'saltworks', kind: 'open', x: 560, y: 190, w: 290, h: 56 },
      { id: 'engine', kind: 'open', x: 520, y: 150, w: 220, h: 56 },
    ];
    const spots = layoutMapLabels(labels, zones, screen);
    const boxes = labels.map((l, i) => boxOf(l, spots[i]));
    for (let i = 1; i < boxes.length; i++) {
      for (const z of zones) expect(apart(boxes[i], z), `${labels[i].id} ${JSON.stringify(boxes[i])} ${JSON.stringify(spots[i])}`).toBe(true);
      for (let j = i + 1; j < boxes.length; j++) expect(apart(boxes[i], boxes[j]), `${labels[i].id} ${labels[j].id}`).toBe(true);
      expect(boxes[i].right).toBeLessThanOrEqual(667 - MAP_EDGE);
      expect(boxes[i].bottom).toBeLessThanOrEqual(375 - MAP_EDGE);
    }
    // Plus de forme serrée sur deux lignes : les noms qui ne tiennent pas se taisent, les autres restent entiers.
    expect(spots.filter((s) => s.id !== 'keo' && s.name).length).toBeGreaterThanOrEqual(3);
    expect(spots.some((s) => s.id !== 'keo' && !s.name)).toBe(true);
  });

  it('un lieu ouvert serré entre un cadenas et l’Escale garde son nom entier s’il a une place près de lui, jamais sur un cadenas (relecture de L6b)', () => {
    // Le téléphone couché (tel667-carte) : le Chantier naval ouvert entre Kéo, les Quais fermés et l'Escale.
    const screen = { width: 667, height: 375 };
    const zones = [
      { left: 0, top: 0, right: 120, bottom: 375 },
      { left: 595, top: 10, right: 657, bottom: 66 },
    ];
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 384, y: 320, w: 110, h: 44 },
      { id: 'port', kind: 'open', x: 330, y: 300, w: 160, h: 50, first: true },
      { id: 'quais', kind: 'closed', x: 398, y: 268, w: 140, h: 84 },
      { id: 'saltworks', kind: 'closed', x: 530, y: 226, w: 200, h: 84 },
      { id: 'shipyard', kind: 'open', x: 455, y: 300, w: 250, h: 82 },
    ];
    const spots = layoutMapLabels(labels, zones, screen);
    const ship = spots[4];
    expect(ship.name).toBe(true);
    const box = boxOf(labels[4], ship);
    for (const l of labels.filter((x) => x.kind === 'closed')) {
      const lock = { left: l.x - MAP_LOCK / 2, top: l.y - MAP_LOCK, right: l.x + MAP_LOCK / 2, bottom: l.y };
      expect(apart(box, lock), l.id).toBe(true);
    }
    for (const z of zones) expect(apart(box, z)).toBe(true);
  });

  it('nulle part sans toucher une autre étiquette : la pastille se réduit à son icône, jamais un nom sur un autre', () => {
    const screen = { width: 400 + 2 * MAP_EDGE, height: 200 + 2 * MAP_EDGE };
    const big = { w: 300, h: 150 };
    const labels: MapLabel[] = [
      { id: 'port', kind: 'open', x: 200 + MAP_EDGE, y: 100 + MAP_EDGE, ...big, first: true },
      { id: 'phare', kind: 'open', x: 210 + MAP_EDGE, y: 110 + MAP_EDGE, ...big },
    ];
    const spots = layoutMapLabels(labels, [], screen);
    expect(spots[0].name).toBe(true);
    expect(spots[1].name).toBe(false);
    expect(apart(boxOf(labels[0], spots[0]), boxOf(labels[1], spots[1]))).toBe(true);
  });

  it('l’Escale passe en premier : serrée, elle garde son nom, les autres lieux se taisent d’abord', () => {
    const screen = { width: 667, height: 375 };
    const zones = [
      { left: 0, top: 0, right: 72, bottom: 375 },
      { left: 10, top: 280, right: 130, bottom: 365 },
    ];
    const crowd: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 330, y: 300, w: 120, h: 50 },
      { id: 'phare', kind: 'open', x: 330, y: 200, w: 260, h: 70 },
      { id: 'quais', kind: 'open', x: 420, y: 240, w: 260, h: 70 },
      { id: 'filets', kind: 'open', x: 300, y: 110, w: 260, h: 70 },
      { id: 'ecluses', kind: 'open', x: 470, y: 120, w: 300, h: 70 },
    ];
    const port: MapLabel = { id: 'port', kind: 'open', x: 340, y: 330, w: 260, h: 70 };
    const all = (first: boolean) => layoutMapLabels([...crowd, { ...port, first }], zones, screen);
    const last = (first: boolean) => all(first).find((s) => s.id === 'port')!;
    expect(last(true).name).toBe(true);
    // Les autres se taisent au besoin, un nom n'est jamais coupé.
    expect(all(true).some((s) => s.id !== 'keo' && !s.name)).toBe(true);
  });

  it('sur la tablette, le nom d’un lieu fermé glisse de côté sous son cadenas plutôt que de se taire (relecture de L6b)', () => {
    // tab-carte : la Turbine fermée, son nom sous son cadenas touchait une étiquette posée juste dessous à droite.
    const labels: MapLabel[] = [
      { id: 'engine', kind: 'closed', x: 805, y: 380, w: 170, h: 84 },
      { id: 'shipyard', kind: 'open', x: 950, y: 470, w: 160, h: 48 },
    ];
    const [engine, ship] = layoutMapLabels(labels, [], { width: 1024, height: 768 });
    expect(ship.name).toBe(true);
    expect(engine.name).toBe(true);
    // Le cadenas reste au-dessus de son nom.
    const left = 805 - 85 + (engine.shift ?? 0);
    expect(left).toBeLessThanOrEqual(805 - MAP_LOCK / 2);
    expect(left + 170).toBeGreaterThanOrEqual(805 + MAP_LOCK / 2);
    // Mesuré sur tab-carte : le nom de la Turbine à 2 px de celui des Marais salants, juste dessous. Celui du bas
    // descend d'un pas ; tous deux se montrent, à un écart l'un de l'autre.
    const pair: MapLabel[] = [
      { id: 'saltworks', kind: 'closed', x: 917, y: 449, w: 225, h: 84 },
      { id: 'engine', kind: 'closed', x: 805, y: 399, w: 137, h: 84 },
    ];
    const [salt, turbine] = layoutMapLabels(pair, [], { width: 1024, height: 768 });
    expect(turbine.name).toBe(true);
    expect(salt.name).toBe(true);
    expect(turbine.drop).toBeUndefined();
    expect(salt.drop).toBe(MAP_LABEL_GAP);
    expect(449 + (salt.drop ?? 0)).toBeGreaterThanOrEqual(399 + 84 - MAP_LOCK + MAP_LABEL_GAP);
  });

  it('au large, chaque nom se pose au-dessus de son lieu, Kéo et « Toi » à sa place, les noms des lieux fermés sous leur cadenas', () => {
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 100, y: 300, w: 108, h: 44 },
      { id: 'phare', kind: 'open', x: 500, y: 300, w: 140, h: 50 },
      { id: 'quais', kind: 'closed', x: 800, y: 500, w: 130, h: 84 },
    ];
    const [keo, phare, quais] = layoutMapLabels(labels, [], { width: 1024, height: 768 });
    // Kéo d'un côté fixe : sa pastille centrée sous son point, « Toi » à sa droite.
    expect(keo).toEqual({ id: 'keo', left: 100 - MAP_KEO_DISC / 2, top: 300, name: true });
    expect(phare).toEqual({ id: 'phare', left: 430, top: 250, name: true });
    expect(quais.name).toBe(true);
    expect(quais.top).toBe(500 - MAP_LOCK);
  });

  it('Kéo devant un lieu : le nom du lieu garde sa place, « Toi » se pose sous Kéo, d’un côté fixe, sans jamais le couvrir (chantier de la Carte, lot 13a)', () => {
    const screen = { width: 1024, height: 768 };
    const place: MapLabel = { id: 'donjon', kind: 'open', x: 500, y: 300, w: 160, h: 48 };
    const [alone] = layoutMapLabels([place], [], screen);
    // Kéo à la porte, au sud du lieu, puis juste au nord : le nom ne bouge jamais.
    for (const dy of [12, 30, -20]) {
      const keoAt: MapLabel = { id: 'keo', kind: 'keo', x: 505, y: 300 + dy, w: 108, h: 44 };
      const [keo, name] = layoutMapLabels([keoAt, place], [], screen);
      expect(name, String(dy)).toEqual(alone);
      const k = boxOf(keoAt, keo);
      expect(apart(k, boxOf(place, name)), String(dy)).toBe(true);
    }
    // Loin de tout, « Toi » sous son point, la pastille centrée sur lui.
    const [far] = layoutMapLabels([{ id: 'keo', kind: 'keo', x: 200, y: 600, w: 108, h: 44 }, place], [], screen);
    expect(far).toEqual({ id: 'keo', left: 200 - MAP_KEO_DISC / 2, top: 600, name: true });
  });

  it('« Toi » ne touche jamais un cadenas : Kéo se pose à un écart du cadenas, « Toi » gardé près de son point (relecture de L6a, des restes du 5e)', () => {
    // Le téléphone couché (tel844-carte) : Kéo devant la Turbine, le cadenas des Marais salants juste à droite.
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 570, y: 212, w: 108, h: 44 },
      { id: 'saltworks', kind: 'closed', x: 627, y: 227, w: 200, h: 84 },
    ];
    const [keo] = layoutMapLabels(labels, [], { width: 844, height: 390 });
    expect(keo.name).toBe(true);
    const box = boxOf(labels[0], keo);
    expect(apart(box, { left: 627 - MAP_LOCK / 2, top: 227 - MAP_LOCK, right: 627 + MAP_LOCK / 2, bottom: 227 })).toBe(true);
    // Sa pastille à sa taille au plus de son point.
    expect(Math.max(box.left - 570, 0, 570 - (box.left + MAP_KEO_DISC)) + Math.max(box.top - 212, 0, 212 - box.bottom)).toBeLessThanOrEqual(MAP_KEO_DISC);
    // Loin de tout cadenas, « Toi » reste à son côté fixe.
    expect(layoutMapLabels([labels[0]], [], { width: 844, height: 390 })[0]).toEqual({ id: 'keo', left: 570 - MAP_KEO_DISC / 2, top: 212, name: true });
  });

  it('« Toi » à droite de la pastille, sinon à gauche, sinon dessous, avant la pastille seule ; jamais sur le nom d’un voisin (seconde passe du directeur artistique, les Terrasses)', () => {
    const screen = { width: 1024, height: 768 };
    const keoAt: MapLabel = { id: 'keo', kind: 'keo', x: 500, y: 300, w: 108, h: 44, stacked: { w: 44, h: 76 } };
    const cross = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    // Deux bandes interdites (des boutons, ou les noms des voisins), de part et d'autre du point.
    const east = { left: 540, top: 180, right: 700, bottom: 420 };
    const west = { left: 300, top: 180, right: 460, bottom: 420 };
    const check = (l: MapLabel, zones: { left: number; top: number; right: number; bottom: number }[]) => {
      const [k] = layoutMapLabels([l], zones, screen);
      const box = boxOf(l, k);
      for (const z of zones) expect(cross(box, z)).toBe(false);
      // La pastille toujours centrée sous son point.
      const disc = k.toi === 'gauche' ? k.left + l.w - MAP_KEO_DISC : k.toi === 'dessous' ? k.left + l.stacked!.w / 2 - MAP_KEO_DISC / 2 : k.left;
      expect(disc + MAP_KEO_DISC / 2).toBe(500);
      return k;
    };
    // La place à droite prise : « Toi » à gauche, la pastille au même endroit.
    expect(check(keoAt, [east])).toEqual({ id: 'keo', left: 500 + MAP_KEO_DISC / 2 - 108, top: 300, name: true, toi: 'gauche' });
    // Prise des deux côtés : « Toi » sous la pastille.
    expect(check(keoAt, [east, west])).toEqual({ id: 'keo', left: 500 - 22, top: 300, name: true, toi: 'dessous' });
    // Sans la taille empilée mesurée : la pastille seule.
    expect(check({ ...keoAt, stacked: undefined }, [east, west]).name).toBe(false);
    // Tout pris à la taille de la pastille autour du point, une place libre un peu plus loin : « Toi » y va, la pastille
    // à `NEAR.reach` au plus de son point (80 px), comme la pastille seule.
    const ring = { left: 380, top: 250, right: 620, bottom: 352 };
    const [far] = layoutMapLabels([keoAt], [ring], screen);
    expect(far.name).toBe(true);
    const fb = boxOf(keoAt, far);
    expect(cross(fb, ring)).toBe(false);
    const fd = far.toi === 'gauche' ? fb.right - MAP_KEO_DISC : far.toi === 'dessous' ? fb.left + keoAt.stacked!.w / 2 - MAP_KEO_DISC / 2 : fb.left;
    const gap = Math.hypot(Math.max(fd - 500, 0, 500 - (fd + MAP_KEO_DISC)), Math.max(fb.top - 300, 0, 300 - (fb.top + MAP_KEO_DISC)));
    expect(gap).toBeGreaterThan(MAP_KEO_DISC);
    expect(gap).toBeLessThanOrEqual(80);
    // Rien autour : à droite, comme avant.
    expect(layoutMapLabels([keoAt], [], screen)[0]).toEqual({ id: 'keo', left: 500 - MAP_KEO_DISC / 2, top: 300, name: true });
  });

  it('Kéo cerné de noms (l’Auberge, relecture des restes du 5e) : sa pastille reste près de son point, jamais sur le nom d’un voisin, au pire sur le nom de son lieu', () => {
    const screen = { width: 1024, height: 768 };
    // Kéo à l'Auberge, entre la Lisière au-dessus, le Hameau dessous, et deux voisins de côté.
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 500, y: 300, w: 108, h: 44 },
      { id: 'auberge', kind: 'open', x: 505, y: 296, w: 200, h: 48 },
      { id: 'lisiere', kind: 'open', x: 500, y: 236, w: 200, h: 48 },
      { id: 'hameau', kind: 'open', x: 500, y: 364, w: 200, h: 48 },
      { id: 'radeaux', kind: 'open', x: 350, y: 320, w: 200, h: 48 },
      { id: 'croisee', kind: 'open', x: 650, y: 320, w: 200, h: 48 },
    ];
    const spots = layoutMapLabels(labels, [], screen);
    const boxes = labels.map((l, i) => boxOf(l, spots[i]));
    const keo = boxes[0];
    const disc = { ...keo, right: keo.left + MAP_KEO_DISC };
    const gap = Math.hypot(Math.max(disc.left - 500, 0, 500 - disc.right), Math.max(disc.top - 300, 0, 300 - disc.bottom));
    expect(gap).toBeLessThanOrEqual(80);
    const cross = (a: typeof keo, b: typeof keo) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    // Jamais sur le nom d'un voisin ; au pire à cheval sur le bord du sien, jamais au milieu.
    expect(spots[0].name).toBe(false);
    for (let i = 2; i < labels.length; i++) expect(cross(keo, boxes[i]), labels[i].id).toBe(false);
    const cx = disc.left + MAP_KEO_DISC / 2,
      cy = disc.top + labels[0].h / 2;
    expect(cx > boxes[1].left && cx < boxes[1].right && cy > boxes[1].top && cy < boxes[1].bottom).toBe(false);
    // Un lieu d'une terre fermée au lieu du Hameau : sa pastille d'icône, sans nom, posée après Kéo, ne le couvre pas.
    const paled = labels.map((l) => (l.id === 'hameau' ? { ...l, pale: true as const } : l));
    const pale = layoutMapLabels(paled, [], screen);
    expect(pale[3].name).toBe(false);
    expect(cross(boxOf(paled[0], pale[0]), boxOf(paled[3], pale[3]))).toBe(false);
  });

  it('le nom d’un lieu fermé près du bord glisse sous son cadenas et reste entier dans l’écran, le cadenas sur son lieu (relecture de L6a)', () => {
    // Les Marais salants au bord droit de la tablette (tab-carte) : la boîte du nom touchait le bord.
    const labels: MapLabel[] = [{ id: 'saltworks', kind: 'closed', x: 917, y: 450, w: 220, h: 84 }];
    for (const width of [1024, 844, 667]) {
      const [spot] = layoutMapLabels(labels.map((l) => ({ ...l, x: width - 107 })), [], { width, height: 768 });
      expect(spot.left).toBe(width - 107 - 110);
      expect(spot.name).toBe(true);
      const left = width - 107 - 110 + (spot.shift ?? 0);
      expect(left + 220).toBeLessThanOrEqual(width - MAP_LABEL_GAP);
      expect(left).toBeGreaterThanOrEqual(MAP_LABEL_GAP);
    }
    // Loin du bord, rien ne glisse.
    expect(layoutMapLabels(labels, [], { width: 2000, height: 768 })[0].shift).toBeUndefined();
  });

  it('un cadenas ne coiffe jamais le nom d’un lieu ouvert : la place du nom d’un lieu fermé, sous son cadenas, reste libre (relecture de L6a)', () => {
    // La tablette, la Carte entière : les Écluses fermées juste au-dessus et à gauche de la Turbine ouverte (tab-carte).
    const labels: MapLabel[] = [
      { id: 'ecluses', kind: 'closed', x: 733, y: 275, w: 160, h: 84 },
      { id: 'engine', kind: 'open', x: 807, y: 280, w: 192, h: 48 },
    ];
    const [ecluses, engine] = layoutMapLabels(labels, [], { width: 1024, height: 768 });
    const lock = { left: 733 - MAP_LOCK / 2, right: 733 + MAP_LOCK / 2, bottom: 275 };
    const name = { left: 733 - 80, right: 733 + 80, top: 275, bottom: 275 + 84 - MAP_LOCK };
    const label = { left: engine.left, right: engine.left + 192, top: engine.top, bottom: engine.top + 48 };
    // Ni sous le cadenas (dans la place de son nom), ni collé dessous.
    const overlaps = (a: typeof label, b: typeof name) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    expect(overlaps(label, name)).toBe(false);
    expect(label.left < lock.right && lock.left < label.right && label.top >= lock.bottom && label.top < lock.bottom + MAP_LABEL_GAP + 1).toBe(false);
    // Le nom des Écluses se montre sous son cadenas : le cadenas se lit comme le sien.
    expect(ecluses.name).toBe(true);
    expect(engine.name).toBe(true);
  });

  it('sur la tablette, le nom d’une terre fermée reste sur une ligne : sans place dessous, il passe au-dessus de son cadenas, sinon il se tait (piste B)', () => {
    // Au plus grand texte : « Les Marais salants » sur une ligne (496 px) ne tient pas entre un bouton à gauche et le
    // bord droit de l'écran, sous son cadenas.
    const labels: MapLabel[] = [
      { id: 'phare', kind: 'open', x: 900, y: 300, w: 200, h: 78 },
      { id: 'saltworks', kind: 'closed', x: 700, y: 449, w: 496, h: 107 },
    ];
    const button = { left: 0, top: 440, right: 600, bottom: 560 };
    const screen = { width: 1024, height: 768 };
    const [phare, risen] = layoutMapLabels(labels, [button], screen);
    expect(phare.name).toBe(true);
    // Au-dessus de son cadenas, collé à lui (relecture de L9), entier sur une ligne.
    expect(risen.name).toBe(true);
    expect(449 + risen.drop! + 107 - MAP_LOCK).toBeLessThanOrEqual(449 - MAP_LOCK);
    const left = 700 - 496 / 2 + (risen.shift ?? 0);
    const name = { left, top: 449 + risen.drop!, right: left + 496, bottom: 449 + risen.drop! + 107 - MAP_LOCK };
    expect(apart(name, boxOf(labels[0], phare))).toBe(true);
    expect(apart(name, button)).toBe(true);
    // Là aussi pris, il se tait : le cadenas reste.
    const roof = { left: 0, top: 0, right: 1024, bottom: 400 };
    expect(layoutMapLabels(labels, [button, roof], screen)[1].name).toBe(false);
  });

  it('un nom ne s’éloigne pas de plus de 80 px de son lieu ; sans place entière près de lui, il se tait, sa pastille d’icône près de son point (relecture du rivage sud, piste B)', () => {
    // Le Phare ouvert, entre deux boutons : son nom entier (260 px) ne passe pas entre eux ; plus de forme sur deux lignes.
    const screen = { width: 667, height: 375 };
    const at = { x: 330, y: 190 };
    const buttons = [
      { left: 0, top: 0, right: 200, bottom: 375 },
      { left: 460, top: 0, right: 667, bottom: 375 },
    ];
    const phare: MapLabel = { id: 'phare', kind: 'open', ...at, w: 260, h: 60 };
    const [spot] = layoutMapLabels([phare], buttons, screen);
    expect(spot.name).toBe(false);
    const box = boxOf(phare, spot);
    const gap = Math.hypot(Math.max(box.left - at.x, 0, at.x - box.right), Math.max(box.top - at.y, 0, at.y - box.bottom));
    expect(gap).toBeLessThanOrEqual(80);
    // Un nom plus court y tient, entier.
    const [short] = layoutMapLabels([{ ...phare, w: 220 }], buttons, screen);
    expect(short.name).toBe(true);
    const sb = boxOf({ ...phare, w: 220 }, short);
    expect(Math.hypot(Math.max(sb.left - at.x, 0, at.x - sb.right), Math.max(sb.top - at.y, 0, at.y - sb.bottom))).toBeLessThanOrEqual(80);
  });

  it('nulle part près de son lieu : un lieu ouvert se réduit à son icône plutôt que son nom aille à plus de 80 px (GD-20, portée refusée)', () => {
    const screen = { width: 700, height: 400 };
    // Une barre de boutons sur tout le milieu de l'écran, le lieu dessous : de la place loin de lui, en haut et en bas.
    const bar = { left: 0, top: 100, right: 700, bottom: 300 };
    const label: MapLabel = { id: 'phare', kind: 'open', x: 350, y: 200, w: 200, h: 60 };
    const [spot] = layoutMapLabels([label], [bar], screen);
    expect(spot.name).toBe(false);
  });

  it('le nom d’une terre fermée garde sa place sous son cadenas, même au prix du nom d’un lieu ouvert, qui se tait (relecture des restes du 4e : « Le Bastion » disparaissait)', () => {
    // Une seule place près du Phare ouvert : celle du nom des Quais fermés, sous leur cadenas, au-dessus du Phare.
    const screen = { width: 1024, height: 768 };
    const box = { left: 180, top: 50, right: 420, bottom: 168 };
    const walls = [
      { left: 0, top: 0, right: box.left - 8, bottom: 768 },
      { left: box.right + 8, top: 0, right: 1024, bottom: 768 },
      { left: 0, top: 0, right: 1024, bottom: box.top - 8 },
      { left: 0, top: box.bottom + 8, right: 1024, bottom: 768 },
    ];
    const labels: MapLabel[] = [
      { id: 'quais', kind: 'closed', x: 300, y: 100, w: 200, h: 84 },
      { id: 'phare', kind: 'open', x: 300, y: 150, w: 200, h: 40 },
    ];
    // Sans la reprise (les vues essayées de la Carte, qui ne pèsent que les lieux ouverts), le nom ouvert d'abord.
    const [plainQuais, plainPhare] = layoutMapLabels(labels, walls, screen, false);
    expect(plainPhare.name).toBe(true);
    expect(plainQuais.name).toBe(false);
    // Avec elle, le nom des Quais sous leur cadenas, le Phare réduit à sa pastille, qui ne passe pas sous lui.
    const [quais, phare] = layoutMapLabels(labels, walls, screen);
    expect(quais.name).toBe(true);
    expect(quais.drop ?? 0).toBeGreaterThanOrEqual(0);
    expect(phare.name).toBe(false);
    const name = { left: 300 - 100 + (quais.shift ?? 0), top: 100 + (quais.drop ?? 0), right: 300 + 100 + (quais.shift ?? 0), bottom: 100 + (quais.drop ?? 0) + 84 - MAP_LOCK };
    const pastille = { left: phare.left, top: phare.top, right: phare.left + MAP_COMPACT, bottom: phare.top + MAP_COMPACT };
    expect(pastille.left < name.right && name.left < pastille.right && pastille.top < name.bottom && name.top < pastille.bottom).toBe(false);
    // Le cadenas reste.
    expect(quais.top).toBe(100 - MAP_LOCK);
  });

  it('le nom d’un lieu fermé descend de plus d’un pas sous son cadenas, à 80 px au plus, rien entre eux', () => {
    // Deux boutons de part et d'autre du cadenas, à sa hauteur : son nom, large, passe dessous.
    const screen = { width: 1024, height: 768 };
    const buttons = [
      { left: 100, top: 190, right: 240, bottom: 250 },
      { left: 560, top: 190, right: 700, bottom: 250 },
    ];
    const l: MapLabel = { id: 'filets', kind: 'closed', x: 500, y: 200, w: 300, h: 84 };
    const [spot] = layoutMapLabels([l], buttons, screen);
    expect(spot.name).toBe(true);
    expect(spot.drop).toBeGreaterThan(2 * MAP_LABEL_GAP);
    expect(spot.drop).toBeLessThanOrEqual(80);
    const left = 500 - 150 + (spot.shift ?? 0);
    const name = { left, top: 200 + spot.drop!, right: left + 300, bottom: 200 + spot.drop! + 84 - MAP_LOCK };
    for (const b of buttons) expect(apart(name, b)).toBe(true);
    // Le cadenas reste au-dessus de son nom.
    expect(left).toBeLessThanOrEqual(500 - MAP_LOCK / 2);
    expect(left + 300).toBeGreaterThanOrEqual(500 + MAP_LOCK / 2);
    // Un bouton juste sous le cadenas : le nom ne descend pas au-delà ; il passe au-dessus du cadenas, collé à lui, rien
    // entre eux (relecture de L9), et se tait si le dessus est pris aussi.
    const under = { left: 470, top: 212, right: 530, bottom: 240 };
    const up = layoutMapLabels([l], [...buttons, under], screen)[0];
    expect(up.name).toBe(true);
    expect(200 + up.drop! + 84 - MAP_LOCK).toBeLessThanOrEqual(200 - MAP_LOCK);
    expect(200 + up.drop! + 84 - MAP_LOCK).toBeGreaterThanOrEqual(200 - MAP_LOCK - MAP_LABEL_GAP);
    const over = { left: 300, top: 100, right: 700, bottom: 158 };
    expect(layoutMapLabels([l], [...buttons, under, over], screen)[0].name).toBe(false);
  });

  it('au-dessus de son cadenas, seulement si aucun autre cadenas n’est à moins de 40 px du nom (troisième passe de L9)', () => {
    // Le même nom, sans place dessous : il monte au-dessus de son cadenas (de 350 à 650, de 112 à 156).
    const screen = { width: 1024, height: 768 };
    const buttons = [
      { left: 100, top: 190, right: 240, bottom: 250 },
      { left: 560, top: 190, right: 700, bottom: 250 },
      { left: 470, top: 212, right: 530, bottom: 240 },
    ];
    const l: MapLabel = { id: 'filets', kind: 'closed', x: 500, y: 200, w: 300, h: 84 };
    // Deux autres cadenas, à gauche et à droite du nom, chacun à `gap` px de lui : glissé de côté, il s'approche de l'un.
    const others = (gap: number): MapLabel[] => [
      { id: 'ecluses', kind: 'closed', x: 350 - gap - MAP_LOCK / 2, y: 150, w: 60, h: 84 },
      { id: 'turbine', kind: 'closed', x: 650 + gap + MAP_LOCK / 2, y: 150, w: 60, h: 84 },
    ];
    const far = layoutMapLabels([l, ...others(44)], buttons, screen)[0];
    expect(far.name).toBe(true);
    expect(far.drop).toBeLessThan(0);
    expect(far.shift ?? 0).toBe(0);
    expect(layoutMapLabels([l, ...others(36)], buttons, screen)[0].name).toBe(false);
  });
});

describe('La Carte avec le rivage nord (lot L7)', () => {
  // Les étiquettes posées aux vraies places des quatorze lieux, de l'Escale et de Kéo (devant les Archives), dans la vue de départ de
  // la Carte, en texte normal ; les tailles mesurées sur la capture de la tablette (gd20-l7-reprise/carte-1024).
  const open = new Set(['phare', 'shipyard', 'lookout', 'archives', 'printworks']);
  const sizes: Record<string, [number, number]> = {
    phare: [140, 48], quais: [130, 84], filets: [128, 84], ecluses: [148, 84], saltworks: [225, 84], engine: [137, 84],
    shipyard: [252, 84], lookout: [164, 48], archives: [214, 48], printworks: [216, 48],
    // Le rivage sud (lot L8), fermé : sur deux lignes, la largeur estimée sur celle des noms du même nombre de lettres.
    mangrove: [160, 84], ruins: [145, 84], observatory: [200, 84], commons: [120, 84],
    // Le large (lot L9), fermé : « Les Balises » sur deux lignes ; « La Gare maritime » aussi, la largeur de « maritime ».
    beacons: [140, 84], ferry: [150, 84],
  };
  const labelsOn = (w: number, h: number, view = mapStart(PLAN, w / h)): MapLabel[] => {
    const pose = mapPose(view);
    const at = (p: Vec3) => screenOf(pose, p, w, h);
    const archives = placeById('archives').center;
    const keo = at({ x: archives.x - 4, y: standingHeight(heightAt(archives)), z: archives.z + 6 });
    const port = at(PORT_MAP_POINT);
    return [
      { id: 'keo', kind: 'keo', x: keo.x, y: keo.y, w: 108, h: 44 },
      { id: 'port', kind: 'open', x: port.x, y: port.y, w: 156, h: 48, first: true },
      ...PLACES.map((p): MapLabel => {
        const foot = { x: p.center.x, y: standingHeight(heightAt(p.center)), z: p.center.z };
        const o = markOffset(p.id);
        const s = at({ x: foot.x + o.x, y: foot.y + o.y, z: foot.z + o.z });
        const [lw, lh] = sizes[p.id];
        return { id: p.id, kind: open.has(p.id) ? 'open' : 'closed', x: s.x, y: s.y, w: lw, h: lh };
      }),
    ];
  };
  const boxOf = (l: MapLabel, s: MapLabelSpot) => {
    if (l.kind === 'closed') {
      const name = s.left + (s.shift ?? 0);
      return s.name
        ? { left: Math.min(name, l.x - MAP_LOCK / 2), top: s.top + (s.drop ?? 0), right: Math.max(name + l.w, l.x + MAP_LOCK / 2), bottom: s.top + (s.drop ?? 0) + l.h }
        : { left: l.x - MAP_LOCK / 2, top: s.top, right: l.x + MAP_LOCK / 2, bottom: s.top + MAP_LOCK };
    }
    if (l.kind === 'keo' && s.toi === 'dessous') return { left: s.left, top: s.top, right: s.left + l.stacked!.w, bottom: s.top + l.stacked!.h };
    if (l.kind === 'keo') return { left: s.left, top: s.top, right: s.left + (s.name ? l.w : MAP_KEO_DISC), bottom: s.top + l.h };
    if (!s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    return { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h };
  };
  const overlap = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  for (const [w, h] of [[1024, 768], [844, 390]] as const) {
    it(`${w} × ${h} : chaque lieu ouvert du rivage nord garde son nom, jamais sur un cadenas, sur « Toi » ni sur un autre nom`, () => {
      // La vue de départ que choisit la Carte (`reframeMap`, comme la scène) : les lieux hors de la zone des étiquettes
      // n'en ont pas (`mapShown`, scene.ts : `mapLabelSide` des côtés, 64 px du haut, 24 px du bas) ; ce qui manque est pesé
      // comme `crowded` (MapLabels.tsx, `MISSING`) : 100 par lieu ouvert sans nom ou hors de la zone, 1 par lieu fermé
      // hors de la zone sur tablette (plus de 500 px de haut).
      const inside = (l: MapLabel) => l.x > mapLabelSide(w) && l.x < w - mapLabelSide(w) && l.y > 64 && l.y < h - 24;
      const ground = PLACES.filter((p) => open.has(p.id)).map((p) => p.center);
      const chosen = reframeMap(PLAN, w / h, [...ground, PORT_MAP_POINT], (v) => {
        const all = labelsOn(w, h, v);
        const shown = all.filter(inside);
        const gone = all.filter((l) => l.kind !== 'keo' && !inside(l)).reduce((n, l) => n + (l.kind === 'open' ? 100 : h > 500 ? 1 : 0), 0);
        const spots = layoutMapLabels(shown, [], { width: w, height: h }, false);
        return gone + 100 * spots.filter((s, i) => shown[i].kind === 'open' && !s.name).length;
      });
      const view = clampMap(PLAN, chosen, w / h, chosen.distance);
      const labels = labelsOn(w, h, view).filter((l) => l.kind !== 'closed' || inside(l));
      for (const l of labels) {
        expect(l.x, l.id).toBeGreaterThan(0);
        expect(l.x, l.id).toBeLessThan(w);
        expect(l.y, l.id).toBeGreaterThan(0);
        expect(l.y, l.id).toBeLessThan(h);
      }
      const spots = layoutMapLabels(labels, [], { width: w, height: h });
      const boxes = labels.map((l, i) => boxOf(l, spots[i]));
      for (const id of ['lookout', 'archives', 'printworks']) {
        const i = labels.findIndex((l) => l.id === id);
        expect(spots[i].name, id).toBe(true);
        for (let j = 0; j < labels.length; j++) if (j !== i) expect(overlap(boxes[i], boxes[j]), `${id} ${labels[j].id}`).toBe(false);
      }
      // Sur la tablette, tout lieu montre son nom, ouvert ou fermé (relecture de L6b).
      if (w === 1024) for (let i = 1; i < labels.length; i++) expect(spots[i].name, labels[i].id).toBe(true);
    });
  }
});

describe('« Retour » et « Lieux » (relecture de L9)', () => {
  it('aucun nom à moins de 16 px de la barre du bas, Kéo devant son lieu', () => {
    const screen = { width: 1024, height: 768 };
    const bar = { left: 10, top: 686, right: 420, bottom: 752 };
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 236, y: 620, w: 108, h: 44 },
      { id: 'ferry', kind: 'open', x: 232, y: 620, w: 250, h: 48 },
    ];
    const [, spot] = layoutMapLabels(labels, [grown(bar, MAP_BAR_ROOM)], screen);
    expect(spot.name).toBe(true);
    const bottom = spot.top + 48;
    const right = spot.left + 250;
    const gap = Math.max(bar.top - bottom, spot.left - bar.right, bar.left - right);
    expect(gap).toBeGreaterThanOrEqual(16);
  });
});

describe('La reprise des noms fermés tus (relecture de L9)', () => {
  const screen = { width: 1024, height: 768 };
  // Un lieu fermé tu sous un autre lieu fermé dont le nom, haut et étroit, couvre toutes ses places : garder l'une d'elles
  // fait taire le nom du dessus, la reprise la refuse.
  const pair = (id: string, x: number): MapLabel[] => [
    { id: `${id}-haut`, kind: 'closed', x: x + 58, y: 50, w: 60, h: 264 },
    { id, kind: 'closed', x, y: 150, w: 100, h: 84 },
  ];
  // Le dernier lieu fermé tu, en bas : un bouton sous son cadenas, son nom n'a qu'une place, au-dessus de lui, que le
  // nom d'un lieu ouvert prend d'abord et peut laisser.
  const last: MapLabel[] = [
    { id: 'dernier', kind: 'closed', x: 500, y: 600, w: 100, h: 84 },
    { id: 'ouvert', kind: 'open', x: 500, y: 530, w: 160, h: 40 },
  ];
  const under = { left: 470, top: 612, right: 530, bottom: 640 };
  const named = (spots: MapLabelSpot[], id: string) => spots.find((s) => s.id === id)!.name;

  it('chaque nom tu a sa part des essais : le dernier retrouve son nom, même quand les premiers ont plus de douze places refusées', () => {
    const labels = [...pair('a', 200), ...pair('b', 450), ...pair('c', 700), ...last];
    // Sans reprise, les quatre se taisent.
    const plain = layoutMapLabels(labels, [under], screen, false);
    for (const id of ['a', 'b', 'c', 'dernier']) expect(named(plain, id), id).toBe(false);
    const spots = layoutMapLabels(labels, [under], screen);
    for (const id of ['a', 'b', 'c']) expect(named(spots, id), id).toBe(false);
    for (const id of ['a-haut', 'b-haut', 'c-haut', 'ouvert', 'dernier']) expect(named(spots, id), id).toBe(true);
    // Au-dessus de son cadenas.
    expect(spots.find((s) => s.id === 'dernier')!.drop).toBeLessThan(0);
  });

  it('sans autre place que celle du nom fermé, au-dessus de son cadenas, le nom ouvert se tait : la terre fermée garde son nom (relecture des restes du 4e)', () => {
    // Le nom du lieu ouvert n'a de place que sur celle du nom fermé, au-dessus du cadenas : il la garde. À gauche, une
    // place pour sa pastille réduite à son icône, trop étroite pour son nom.
    const box = { left: 300, top: 482, right: 588, bottom: 566 };
    const lock = { left: 480, right: 520, bottom: 600 };
    // Une boîte autour, ouverte en bas sous le cadenas seulement, fermée sous lui (le nom ne descend pas).
    const walls = [
      { left: 0, top: 0, right: box.left - 8, bottom: 768 },
      { left: box.right + 8, top: 0, right: 1024, bottom: 768 },
      { left: 0, top: 0, right: 1024, bottom: box.top - 8 },
      { left: 0, top: box.bottom + 8, right: lock.left - 8, bottom: 768 },
      { left: lock.right + 8, top: box.bottom + 8, right: 1024, bottom: 768 },
      { left: 0, top: lock.bottom + 8, right: 1024, bottom: 768 },
    ];
    // Seul, le lieu fermé a sa place au-dessus de son cadenas.
    expect(layoutMapLabels([last[0]], walls, screen)[0].name).toBe(true);
    // Sans la reprise, le nom ouvert d'abord ; avec elle, le nom fermé au-dessus de son cadenas, le lieu ouvert en pastille.
    const plain = layoutMapLabels(last, walls, screen, false);
    expect(named(plain, 'ouvert')).toBe(true);
    expect(named(plain, 'dernier')).toBe(false);
    const spots = layoutMapLabels(last, walls, screen);
    expect(named(spots, 'ouvert')).toBe(false);
    expect(named(spots, 'dernier')).toBe(true);
    expect(spots.find((s) => s.id === 'dernier')!.drop).toBeLessThan(0);
  });
});

describe('La Carte au plus grand texte (deuxième relecture du lot 1 du 4e, consultant UX UI ; aux quatre niveaux depuis la piste B)', () => {
  const screen = { width: 1280, height: 860 };
  it('à `MAP_EDGE` des bords : un nom collé au bord gauche s’en écarte', () => {
    const labels: MapLabel[] = [{ id: 'roches', kind: 'open', x: 110, y: 300, w: 200, h: 60 }];
    const [spot] = layoutMapLabels(labels, [], screen);
    // Centré sur son point, il passerait à 10 px du bord.
    expect(110 - 200 / 2).toBeLessThan(MAP_EDGE);
    expect(spot.left).toBeGreaterThanOrEqual(MAP_EDGE);
  });

  it('le lieu suggéré, posé le premier, garde sa place contre son point', () => {
    const forge: MapLabel = { id: 'forge', kind: 'open', x: 600, y: 400, w: 240, h: 70 };
    const voisin: MapLabel = { id: 'etalon', kind: 'open', x: 620, y: 330, w: 240, h: 70 };
    const after = layoutMapLabels([voisin, forge], [], screen);
    const before = layoutMapLabels([{ ...forge, first: true }, voisin], [], screen);
    const gap = (s: MapLabelSpot, l: MapLabel) => Math.hypot(Math.max(s.left - l.x, 0, l.x - (s.left + l.w)), Math.max(s.top - l.y, 0, l.y - (s.top + l.h)));
    expect(gap(before[0], forge)).toBeLessThanOrEqual(gap(after[1], forge));
    expect(gap(before[0], forge)).toBeLessThanOrEqual(MAP_LABEL_GAP + 1e-6);
  });

  it('les lieux épinglés (l’Épaule) gardent la même disposition quelle que soit la sélection, et aucun nom ne couvre leur point', () => {
    // Trois lieux serrés, comme le Terminus, les Orgues et la Dynamo au pied du volcan.
    const group: MapLabel[] = [
      { id: 'terminus', kind: 'open', x: 300, y: 210, w: 210, h: 50, side: 'left', pinned: true },
      { id: 'orgues', kind: 'open', x: 393, y: 200, w: 190, h: 50, side: 'left', pinned: true },
      { id: 'dynamo', kind: 'open', x: 440, y: 225, w: 200, h: 50, side: 'right', pinned: true },
    ];
    const etalon: MapLabel = { id: 'etalon', kind: 'open', x: 520, y: 300, w: 170, h: 50 };
    const at = (spots: MapLabelSpot[]) => Object.fromEntries(spots.filter((s) => s.id !== 'etalon').map((s) => [s.id, [s.left, s.top]]));
    const none = layoutMapLabels([...group, etalon], [], screen);
    for (const chosen of group) {
      const picked = layoutMapLabels([{ ...chosen, first: true }, ...group.filter((g) => g !== chosen), etalon], [], screen);
      expect(at(picked), chosen.id).toEqual(at(none));
    }
    const etalonFirst = layoutMapLabels([{ ...etalon, first: true }, ...group], [], screen);
    expect(at(etalonFirst)).toEqual(at(none));
    // Aucune étiquette ne couvre le point d'un lieu épinglé qui n'est pas le sien.
    const all = [...group, etalon];
    for (const s of none) {
      const own = all.find((l) => l.id === s.id)!;
      for (const g of group) {
        if (g.id === s.id) continue;
        const inside = g.x > s.left - MAP_PIN_CLEAR && g.x < s.left + own.w + MAP_PIN_CLEAR && g.y > s.top - MAP_PIN_CLEAR && g.y < s.top + own.h + MAP_PIN_CLEAR;
        expect(inside, `${s.id} sur ${g.id}`).toBe(false);
      }
    }
  });
});

describe('Kéo ne cache aucun nom (retouche 1 du lot 1 du 3e, consultant UX UI et référent dys ; aux quatre niveaux depuis la piste B)', () => {
  const screen = { width: 844, height: 390 };
  const cross = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  it('la pastille de Kéo garde sa place avant les lieux pâles : la pastille d’icône d’un voisin ne passe pas dessous, « Toi » ne la couvre pas', () => {
    // Le téléphone couché au plus grand texte : Kéo au Parvis, « Le Kiosque » (une terre fermée) juste à sa gauche.
    const keo: MapLabel = { id: 'keo', kind: 'keo', x: 320, y: 210, w: 130, h: 52, stacked: { w: 60, h: 90 } };
    const kiosque: MapLabel = { id: 'kiosque', kind: 'open', pale: true, x: 250, y: 236, w: 200, h: 52 };
    const [k, name] = layoutMapLabels([keo, kiosque], [], screen);
    const disc = { left: k.left, top: k.top, right: k.left + MAP_KEO_DISC, bottom: k.top + keo.h };
    const toi = k.name ? { left: k.left, top: k.top, right: k.left + (k.toi === 'dessous' ? keo.stacked!.w : keo.w), bottom: k.top + (k.toi === 'dessous' ? keo.stacked!.h : keo.h) } : disc;
    // Un lieu d'une terre fermée n'a pas de nom sur la Carte : sa pastille d'icône.
    expect(name.name).toBe(false);
    const box = { left: name.left, top: name.top, right: name.left + MAP_COMPACT, bottom: name.top + MAP_COMPACT };
    expect(cross(toi, box)).toBe(false);
    expect(cross(disc, box)).toBe(false);
  });

  it('sans place pour « Toi », la pastille seule, à sa place gardée', () => {
    // Des boutons tout autour de la pastille : aucune place pour le mot.
    const keo: MapLabel = { id: 'keo', kind: 'keo', x: 400, y: 200, w: 130, h: 52, stacked: { w: 60, h: 90 } };
    const walls = [
      { left: 0, top: 0, right: 844, bottom: 190 },
      { left: 0, top: 260, right: 844, bottom: 390 },
      { left: 0, top: 190, right: 370, bottom: 260 },
      { left: 432, top: 190, right: 844, bottom: 260 },
    ];
    const [k] = layoutMapLabels([keo], walls, screen);
    expect(k.name).toBe(false);
  });

  it('le lieu suggéré garde son nom, posé avant un voisin plus proche de Kéo, qui se tait s’il n’a plus de place', () => {
    // Le Belvédère suggéré et le Parvis, où est Kéo, au même point : il n'y a qu'une place près d'eux, dans une bande libre.
    const walls = [
      { left: 0, top: 0, right: 844, bottom: 120 },
      { left: 0, top: 260, right: 844, bottom: 390 },
    ];
    const keo: MapLabel = { id: 'keo', kind: 'keo', x: 300, y: 200, w: 130, h: 52 };
    const next: MapLabel = { id: 'belvedere', kind: 'open', first: true, x: 420, y: 200, w: 300, h: 52 };
    const parvis: MapLabel = { id: 'parvis', kind: 'open', x: 400, y: 200, w: 300, h: 52 };
    const [, s, p] = layoutMapLabels([keo, parvis, next], walls, screen).sort((a, b) => ['keo', 'belvedere', 'parvis'].indexOf(a.id) - ['keo', 'belvedere', 'parvis'].indexOf(b.id));
    expect(s.name).toBe(true);
    expect(p.name).toBe(false);
    // Sans la suggestion, le plus proche de Kéo passe d'abord.
    const plain = layoutMapLabels([keo, parvis, { ...next, first: false }], walls, screen);
    expect(plain.find((x) => x.id === 'parvis')!.name).toBe(true);
    expect(plain.find((x) => x.id === 'belvedere')!.name).toBe(false);
  });
});

describe('La Carte du 4e, les Coteaux (retouche 1)', () => {
  // Les points et les tailles mesurés sur la tablette (1024 × 768), tout construit : la Carte ouverte à la Jonction.
  const BUTTONS = [
    { left: 4, top: 678, right: 220, bottom: 760 },
    { left: 12, top: 12, right: 68, bottom: 196 },
    { left: 956, top: 12, right: 1012, bottom: 68 },
  ];
  const SCREEN = { width: 1024, height: 768 };
  const two = (w: number, h: number) => ({ w, h });
  const OUTSIDE: MapLabel[] = [
    { id: 'forge', kind: 'open', x: 511.9, y: 343.4, w: 170, h: 50, below: true },
    { id: 'soute', kind: 'open', x: 718.8, y: 485.3, w: 172, h: 50, below: true },
    { id: 'porte', kind: 'open', x: 624.1, y: 430, w: 168, h: 50, below: true },
    { id: 'etalon', kind: 'open', x: 555.7, y: 329.7, w: 161, h: 50, side: 'right' },
    { id: 'gabarit', kind: 'open', x: 916.7, y: 402.9, w: 191, h: 50, below: true },
    { id: 'manufacture', kind: 'open', x: 813.4, y: 377.5, w: 215, h: 84, side: 'right' },
    { id: 'loge', kind: 'open', x: 875.6, y: 459.4, w: 159, h: 50, below: true },
    { id: 'chariot', kind: 'open', x: 803.7, y: 437.7, w: 190, h: 50, side: 'left' },
  ];
  const NORTH: MapLabel[] = [
    { id: 'terminus', kind: 'open', x: 302.6, y: 185.9, w: 209, h: 50, side: 'left' },
    { id: 'orgues', kind: 'open', x: 393.2, y: 200.1, w: 197, h: 50, below: true },
    { id: 'dynamo', kind: 'open', x: 455.9, y: 232.3, w: 197, h: 50, below: true },
  ];
  const PORT: MapLabel = { id: 'port', kind: 'open', x: 698.2, y: 553.7, w: 180, h: 50, first: true };
  const KEO: MapLabel = { id: 'keo', kind: 'keo', x: 359.6, y: 363.1, w: 108, h: 44, stacked: two(60, 90) };
  const COTEAUX = ['herbier', 'roches', 'jonction', 'veillee', 'basilique'];
  const hits = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const box = (l: MapLabel, s: MapLabelSpot): Rect => {
    if (l.kind === 'keo' && s.toi === 'dessous') return { left: s.left, top: s.top, right: s.left + l.stacked!.w, bottom: s.top + l.stacked!.h };
    if (l.kind === 'keo') return { left: s.left, top: s.top, right: s.left + (s.name ? l.w : MAP_KEO_DISC), bottom: s.top + l.h };
    if (l.kind === 'closed') {
      const left = s.left + (s.shift ?? 0);
      return { left, top: l.y + (s.drop ?? 0), right: left + Math.max(MAP_LOCK, l.w), bottom: l.y + (s.drop ?? 0) + l.h - MAP_LOCK };
    }
    if (!s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    return { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h };
  };

  it('restaurée, « La Jonction » se pose sous son point (épinglée, `MAP_PINNED_4E`), pas au-dessus, dans les Roches', () => {
    const coteaux: MapLabel[] = [
      { id: 'herbier', kind: 'open', x: 257, y: 460.4, w: 173, h: 50, below: true },
      { id: 'roches', kind: 'open', x: 298.2, y: 320.3, w: 195, h: 50, below: true },
      { id: 'jonction', kind: 'open', x: 354.6, y: 372.3, w: 205, h: 50, below: true, first: true },
      { id: 'veillee', kind: 'open', x: 128.5, y: 367.4, w: 207, h: 50, below: true },
      { id: 'basilique', kind: 'open', x: 168.8, y: 417.4, w: 235, h: 50, below: true },
    ];
    const labels = [...OUTSIDE, ...coteaux, ...NORTH, PORT, KEO];
    const spots = layoutMapLabels(labels, BUTTONS, SCREEN);
    const j = spots.find((s) => s.id === 'jonction')!;
    expect(j).toMatchObject({ left: 354.6 - 205 / 2, top: 372.3 + MAP_LABEL_GAP, name: true });
    // Les lieux des Coteaux gardent leur nom entier, sur une ligne ; ceux qui ne tiennent pas (la Veillée et la Basilique, au bout, les plus
    // loin de Kéo, depuis que les noms ne passent plus sur deux lignes : piste B) se taisent, leur pastille d'icône près de leur point.
    const silent = COTEAUX.filter((id) => !spots.find((s) => s.id === id)!.name);
    expect(silent).toEqual(['veillee', 'basilique']);
    const v = box(coteaux[3], spots.find((s) => s.id === 'veillee')!);
    expect(Math.hypot(Math.max(v.left - 128.5, 0, 128.5 - v.right), Math.max(v.top - 367.4, 0, 367.4 - v.bottom))).toBeLessThanOrEqual(80);
    // Sans `first`, elle passe encore avant la Forge (piste B : du plus proche de Kéo au plus loin) ; avant, le nom de la
    // Forge, posé avant, prenait sa place dessous.
    const before = layoutMapLabels(
      labels.map((l) => (l.id === 'jonction' ? { ...l, first: false } : l)),
      BUTTONS,
      SCREEN,
    ).find((s) => s.id === 'jonction')!;
    expect(before.top).toBe(372.3 + MAP_LABEL_GAP);
  });

  it('terre fermée, « Toi » (Kéo à la Forge) ne couvre aucun nom des Coteaux, ni celui de leur pont fermé', () => {
    const coteaux: MapLabel[] = [
      { id: 'herbier', kind: 'open', x: 257, y: 460.4, w: 142, h: 50, below: true, pale: true },
      { id: 'roches', kind: 'open', x: 298.2, y: 320.3, w: 164, h: 50, below: true, pale: true },
      { id: 'jonction', kind: 'open', x: 354.6, y: 372.3, w: 174, h: 50, below: true, pale: true },
      { id: 'veillee', kind: 'open', x: 128.5, y: 367.4, w: 176, h: 50, below: true, pale: true },
      { id: 'basilique', kind: 'open', x: 168.8, y: 417.4, w: 204, h: 50, below: true, pale: true },
    ];
    const bridge: MapLabel = { id: 'pont-coteaux', kind: 'closed', x: 417.1, y: 341.8, w: 155, h: 84 };
    const keo: MapLabel = { ...KEO, x: 514.3, y: 374.7 };
    const covered = (k: MapLabel) => {
      const labels = [...OUTSIDE, ...coteaux, ...NORTH, bridge, PORT, k];
      const spots = layoutMapLabels(labels, BUTTONS, SCREEN);
      const at = (id: string) => box(labels.find((l) => l.id === id)!, spots.find((s) => s.id === id)!);
      const named = (id: string) => spots.find((s) => s.id === id)!.name;
      return [...COTEAUX, 'pont-coteaux'].filter((id) => named(id) && hits(at('keo'), at(id)));
    };
    expect(covered(keo)).toEqual([]);
  });

  it('terre fermée, la pastille de Kéo (à la Forge) ne couvre aucun nom ouvert, et les lieux des Coteaux sont des pastilles d’icône (piste B)', () => {
    const coteaux: MapLabel[] = [
      { id: 'herbier', kind: 'open', x: 257, y: 460.4, w: 142, h: 50, below: true, pale: true },
      { id: 'roches', kind: 'open', x: 298.2, y: 320.3, w: 164, h: 50, below: true, pale: true },
      { id: 'jonction', kind: 'open', x: 354.6, y: 372.3, w: 174, h: 50, below: true, pale: true },
      { id: 'veillee', kind: 'open', x: 128.5, y: 367.4, w: 176, h: 50, below: true, pale: true },
      { id: 'basilique', kind: 'open', x: 168.8, y: 417.4, w: 204, h: 50, below: true, pale: true },
    ];
    const bridge: MapLabel = { id: 'pont-coteaux', kind: 'closed', x: 417.1, y: 341.8, w: 155, h: 84 };
    const keo: MapLabel = { ...KEO, x: 514.3, y: 374.7 };
    const labels = [...OUTSIDE, ...coteaux, ...NORTH, bridge, PORT, keo];
    const spots = layoutMapLabels(labels, BUTTONS, SCREEN);
    const at = (id: string) => box(labels.find((l) => l.id === id)!, spots.find((s) => s.id === id)!);
    const disc = at('keo');
    expect(Math.hypot(Math.max(disc.left - keo.x, 0, keo.x - disc.right), Math.max(disc.top - keo.y, 0, keo.y - disc.bottom))).toBeLessThanOrEqual(80);
    // Aucun nom d'un voisin couvert ; au pire, à cheval sur le bord du nom de son lieu, la Forge, jamais au milieu.
    for (const l of labels) if (l.kind === 'open' && l.id !== 'forge' && spots.find((s) => s.id === l.id)!.name) expect(hits(disc, at(l.id)), l.id).toBe(false);
    const forge = at('forge');
    const cx = (disc.left + disc.right) / 2,
      cy = (disc.top + disc.bottom) / 2;
    expect(cx > forge.left && cx < forge.right && cy > forge.top && cy < forge.bottom).toBe(false);
    for (const id of COTEAUX) expect(spots.find((s) => s.id === id)!.name, id).toBe(false);
  });
});

describe('La Carte du 4e, les Coteaux (retouche 3)', () => {
  // Les points et les tailles mesurés sur la tablette (1024 × 768), la Carte ouverte à la Jonction : la place de l'icône
  // de l'état gardée dès la ruine (openWorld.css), chaque nom a la même taille en ruine et restauré.
  const BUTTONS = [
    { left: 4, top: 678, right: 220.1, bottom: 760 },
    { left: 12, top: 12, right: 68, bottom: 196 },
    { left: 956, top: 12, right: 1012, bottom: 68 },
  ];
  const SCREEN = { width: 1024, height: 768 };
  const at = (id: string, x: number, y: number, w: number, h: number, more: Partial<MapLabel> = {}): MapLabel => ({ id, kind: 'open', x, y, w, h, ...more });
  const COTEAUX = ['herbier', 'roches', 'jonction', 'veillee', 'basilique'];
  // Restaurée : dans l'ordre de la page ; la Jonction posée avant les autres (épinglée, `MAP_PINNED_4E`).
  const RESTORED: MapLabel[] = [
    at('forge', 511.9, 347.1, 170, 50, { below: true }),
    at('soute', 699, 475.5, 172, 50, { below: true }),
    at('porte', 613.6, 425.7, 168, 50, { below: true }),
    at('etalon', 551.8, 334.6, 161, 50, { side: 'right' }),
    at('gabarit', 873.1, 405.1, 191, 50, { below: true }),
    at('manufacture', 790.5, 375.6, 215, 84, { side: 'right' }),
    at('loge', 834.4, 460, 159, 50, { below: true }),
    at('chariot', 784.6, 428, 190, 50, { side: 'left' }),
    at('herbier', 281.3, 453.1, 173, 50, { below: true }),
    at('roches', 317.3, 326, 195, 50, { below: true }),
    at('jonction', 369, 373.3, 205, 50, { below: true, first: true }),
    at('veillee', 163.5, 368.9, 207, 50, { below: true }),
    at('basilique', 201, 414.3, 235, 50, { below: true }),
    at('terminus', 320.6, 202.9, 209, 50, { side: 'left' }),
    at('orgues', 403.4, 215.9, 197, 50, { below: true }),
    at('dynamo', 460.7, 245.4, 197, 50, { below: true }),
    at('port', 679.7, 536.9, 180, 50, { first: true }),
    { id: 'keo', kind: 'keo', x: 373.4, y: 365, w: 108, h: 44, stacked: { w: 60, h: 90 } },
  ];
  // En ruine : les mêmes tailles ; la Jonction, lieu suggéré, en tête (`nextPlace`).
  const RUIN = [RESTORED.find((l) => l.id === 'jonction')!, ...RESTORED.filter((l) => l.id !== 'jonction')];
  const boxOf = (l: MapLabel, s: MapLabelSpot): Rect => (s.name ? { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h } : { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT });
  // Le côté d'un nom par rapport à son point, et sa forme.
  const sides = (labels: readonly MapLabel[]) => {
    const spots = layoutMapLabels(labels, BUTTONS, SCREEN);
    return Object.fromEntries(
      labels
        .filter((l) => l.kind === 'open')
        .map((l) => {
          const s = spots.find((x) => x.id === l.id)!;
          const r = boxOf(l, s);
          const side = r.bottom <= l.y ? 'dessus' : r.top >= l.y ? 'dessous' : r.left >= l.x ? 'droite' : r.right <= l.x ? 'gauche' : 'sur';
          return [l.id, `${side}${s.name ? '' : ', sans nom'}`];
        }),
    );
  };

  it('en ruine puis restaurée, chaque nom garde son côté : aucun ne grandit, « La Basilique » ne change plus de place', () => {
    const ruin = sides(RUIN);
    expect(sides(RESTORED)).toEqual(ruin);
    // Sans la place gardée (retouche 2), un nom des Coteaux en ruine était plus étroit, de la largeur de son icône (31 px) :
    // un nom au moins y changeait de côté.
    const before = RUIN.map((l) => (COTEAUX.includes(l.id) ? { ...l, w: l.w - 31 } : l));
    expect(sides(before)).not.toEqual(ruin);
  });

  it('plus de trait (piste B) : chaque nom montré est à 80 px au plus de son point, et ni Kéo ni « Toi » ne couvrent un nom ouvert', () => {
    for (const labels of [RUIN, RESTORED]) {
      const spots = layoutMapLabels(labels, BUTTONS, SCREEN);
      const keo = labels.find((x) => x.kind === 'keo')!;
      const k = spots.find((x) => x.id === 'keo')!;
      const kr = k.toi === 'dessous' ? { left: k.left, top: k.top, right: k.left + keo.stacked!.w, bottom: k.top + keo.stacked!.h } : { left: k.left, top: k.top, right: k.left + (k.name ? keo.w : MAP_KEO_DISC), bottom: k.top + keo.h };
      for (const l of labels) {
        if (l.kind !== 'open') continue;
        const s = spots.find((x) => x.id === l.id)!;
        const r = boxOf(l, s);
        expect(Math.hypot(Math.max(r.left - l.x, 0, l.x - r.right), Math.max(r.top - l.y, 0, l.y - r.bottom)), l.id).toBeLessThanOrEqual(80);
        if (!s.name) continue;
        expect(kr.left < r.right && r.left < kr.right && kr.top < r.bottom && r.top < kr.bottom, `Kéo sur ${l.id}`).toBe(false);
      }
    }
  });
});

describe('La pastille de Kéo sans place libre près de son point (aux quatre niveaux depuis la piste B)', () => {
  // Une bande libre de 270 à 330 px de haut, le reste de l'écran couvert de boutons ; Kéo à (300, 300).
  const KEO: MapLabel = { id: 'keo', kind: 'keo', x: 300, y: 300, w: 108, h: 44 };
  const SCREEN = { width: 600, height: 600 };
  const BAND = [
    { left: 0, top: 0, right: 600, bottom: 262 },
    { left: 0, top: 338, right: 600, bottom: 600 },
  ];
  const hits = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const discOf = (s: MapLabelSpot): Rect => ({ left: s.left, top: s.top, right: s.left + MAP_KEO_DISC, bottom: s.top + KEO.h });
  const gap = (r: Rect) => Math.hypot(Math.max(r.left - KEO.x, 0, KEO.x - r.right), Math.max(r.top - KEO.y, 0, KEO.y - r.bottom));

  it('rien de libre à 160 px : la place libre la plus proche dans l’écran, jamais sur le nom de son lieu (relecture des restes du 4e : elle touchait « La Forge »)', () => {
    const own: MapLabel = { id: 'forge', kind: 'open', x: 340, y: 300, w: 200, h: 60, side: 'right' };
    const wall = { left: 0, top: 0, right: 312, bottom: 800 };
    const screen = { width: 800, height: 600 };
    const spots = layoutMapLabels([own, KEO], [wall, ...BAND.map((b) => ({ ...b, right: 800 }))], screen);
    const box = { left: spots[0].left, top: spots[0].top, right: spots[0].left + own.w, bottom: spots[0].top + own.h };
    const disc = discOf(spots[1]);
    expect(spots[0].name).toBe(true);
    expect(gap(disc)).toBeGreaterThan(160);
    expect(hits(disc, box)).toBe(false);
    for (const b of [wall, ...BAND]) expect(hits(disc, b)).toBe(false);
    expect(disc.right).toBeLessThanOrEqual(screen.width - MAP_EDGE);
  });

  it('rien de libre à 80 px, aucun nom à lui : libre un peu plus loin, à 160 px au plus, plutôt que sur un nom', () => {
    const [spot] = layoutMapLabels([KEO], [{ left: 0, top: 0, right: 400, bottom: 600 }, ...BAND], SCREEN);
    const disc = discOf(spot);
    expect(gap(disc)).toBeGreaterThan(80);
    expect(gap(disc)).toBeLessThanOrEqual(160);
  });

  it('au pire, un écran plein de noms : de son côté fixe, sous son point, et elle peut alors couvrir une lettre (documenté)', () => {
    const full: MapLabel = { id: 'nom', kind: 'open', x: 150 + MAP_EDGE, y: 200 + MAP_EDGE, w: 300, h: 200 };
    const keo = { ...KEO, x: 150 + MAP_EDGE, y: 100 + MAP_EDGE };
    const spots = layoutMapLabels([full, keo], [], { width: 300 + 2 * MAP_EDGE, height: 200 + 2 * MAP_EDGE });
    expect(spots[0]).toMatchObject({ left: MAP_EDGE, top: MAP_EDGE, name: true });
    expect(spots[1]).toMatchObject({ left: keo.x - MAP_KEO_DISC / 2, top: keo.y, name: false });
    expect(hits(discOf(spots[1]), { left: MAP_EDGE, top: MAP_EDGE, right: 300 + MAP_EDGE, bottom: 200 + MAP_EDGE })).toBe(true);
  });
});

describe('La Carte au téléphone en portrait (restes du 4e)', () => {
  it('le bout de la caméra passe toujours au-delà du coin le plus loin de l’île, même reculée au plus grand texte', () => {
    for (const level of ['6e', '5e', '4e', '3e'] as const) {
      const plan = planFor(level);
      const { minX, maxX, minZ, maxZ } = islandBox(plan);
      for (const [w, h] of [[390, 844], [800, 1280], [1024, 768]] as const) {
        const start = mapStart(plan, w / h);
        const view = { ...start, distance: start.distance * MAP_REFRAME.most };
        const pose = mapPose(view);
        const far = Math.max(...[[minX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ]].map(([x, z]) => Math.hypot(x - pose.position.x, -pose.position.y, z - pose.position.z)));
        expect(mapFarPlane(plan, view), `${level} ${w} × ${h}`).toBeGreaterThan(far);
      }
    }
  });
});

describe('La Carte aux quatre niveaux (piste B, « Noms plafonnés, sans trait », choix du mainteneur du 24 octobre 2026)', () => {
  // Les étiquettes de la vue de départ de chaque niveau, aux tailles qu'en donne la page : le texte de la Carte plafonné à
  // 24 px, jamais sous 18 px (openWorld.css, `clamp(18px, 1rem, 24px)`), les marges en em ; une lettre fait environ 0,6 em.
  // Les lieux de la terre de départ sont ouverts, ceux des autres terres pâles, un cadenas par terre fermée (au milieu de
  // ses lieux), Kéo devant le premier lieu ouvert, les boutons de la page aux coins.
  const font = (setting: number) => Math.min(24, Math.max(18, setting));
  const LEVELS = ['6e', '5e', '4e', '3e'] as const;
  const SCREENS = [
    [390, 844],
    [800, 1280],
    [1024, 768],
  ] as const;
  const TEXTS = { normal: 20, 'plus grand': 32 } as const;
  const gapTo = (p: { x: number; y: number }, r: Rect) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));
  const crosses = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const clashes = (a: Rect, b: Rect) => a.left < b.right + MAP_LABEL_GAP && b.left < a.right + MAP_LABEL_GAP && a.top < b.bottom + MAP_LABEL_GAP && b.top < a.bottom + MAP_LABEL_GAP;
  // Le lieu de Kéo : le lieu ouvert le plus proche de son point, à 80 px au plus.
  const ownOf = (labels: readonly MapLabel[], keo: MapLabel) =>
    labels
      .filter((x) => x.kind === 'open' && !x.pale && Math.hypot(x.x - keo.x, x.y - keo.y) <= 80)
      .sort((a, b) => Math.hypot(a.x - keo.x, a.y - keo.y) - Math.hypot(b.x - keo.x, b.y - keo.y))[0]?.id;
  // `shut` : la seule terre fermée (les autres reliées), comme le Bastion fermé des captures du 4e ; sinon, seule la terre
  // de départ est ouverte.
  const layout = (level: (typeof LEVELS)[number], w: number, h: number, setting: number, view?: MapView, repair = false, shut?: string) => {
    const plan = planFor(level);
    const f = font(setting);
    const pose = mapPose(view ?? mapStart(plan, w / h));
    const at = (p: { x: number; z: number }) => screenOf(pose, { x: p.x, y: 0, z: p.z }, w, h);
    const side = mapLabelSide(w);
    const shown = (s: { x: number; y: number }) => s.x > side && s.x < w - side && s.y > 64 && s.y < h - 24;
    const open = new Set<string>(shut ? plan.lands.filter((l) => l.id !== shut).flatMap((l) => l.places) : plan.lands[0].places);
    const suggested = plan.firstPlace ?? plan.lands[0].places[0];
    const first = plan.places.find((p) => p.id === plan.lands[0].places[0])!;
    const keo = at({ x: first.center.x + 3, z: first.center.z + 4 });
    const labels: MapLabel[] = [];
    if (shown(keo)) labels.push({ id: 'keo', kind: 'keo', x: keo.x, y: keo.y, w: MAP_KEO_DISC + 4 + Math.round(f * 3) + 4, h: MAP_KEO_DISC, stacked: { w: MAP_KEO_DISC, h: MAP_KEO_DISC + 4 + Math.round(f * 1.7) } });
    for (const p of plan.places) {
      const s = at(p.center);
      if (!shown(s)) continue;
      const w0 = Math.round(f * (0.6 * p.name.length + 1.8 + 0.4 + 1.15)) + 4;
      labels.push({ id: p.id, kind: 'open', x: s.x, y: s.y, w: w0, h: Math.max(48, Math.round(f * 2.1) + 4), first: p.id === suggested, ...(open.has(p.id) ? {} : { pale: true as const }) });
    }
    for (const land of shut ? plan.lands.filter((l) => l.id === shut) : plan.lands.slice(1)) {
      const pts = land.places.map((id) => at(plan.places.find((p) => p.id === id)!.center));
      const c = { x: pts.reduce((n, p) => n + p.x, 0) / pts.length, y: pts.reduce((n, p) => n + p.y, 0) / pts.length };
      if (shown(c)) labels.push({ id: `pont-${land.id}`, kind: 'closed', x: c.x, y: c.y, w: Math.round(f * (0.6 * land.name.length + 1.2)) + 4, h: MAP_LOCK + 2 + Math.round(f * 1.7) + 4 });
    }
    const buttons: Rect[] = [
      { left: 12, top: 12, right: 68, bottom: 196 },
      { left: w - 68, top: 12, right: w - 12, bottom: 68 },
      grown({ left: 4, top: h - 90, right: 220, bottom: h - 8 }, MAP_BAR_ROOM),
    ];
    const spots = layoutMapLabels(labels, buttons, { width: w, height: h }, repair);
    // Ce qui manque à cette vue, pesé comme la page (MapLabels.tsx, `MISSING`) : un lieu ouvert sans nom ou hors de l'écran.
    const missing = [...open].filter((id) => !labels.some((l) => l.id === id)).length * 100 + spots.filter((s, i) => labels[i].kind === 'open' && !labels[i].pale && !s.name).length * 100;
    const boxOf = (l: MapLabel, s: MapLabelSpot): Rect => {
      if (l.kind === 'closed') {
        const left = s.left + (s.shift ?? 0);
        return s.name ? { left, top: l.y + (s.drop ?? 0), right: left + l.w, bottom: l.y + (s.drop ?? 0) + l.h - MAP_LOCK } : { left: l.x - MAP_LOCK / 2, top: l.y - MAP_LOCK, right: l.x + MAP_LOCK / 2, bottom: l.y };
      }
      if (l.kind === 'keo') {
        if (s.toi === 'dessous') return { left: s.left, top: s.top, right: s.left + l.stacked!.w, bottom: s.top + l.stacked!.h };
        return { left: s.left, top: s.top, right: s.left + (s.name ? l.w : MAP_KEO_DISC), bottom: s.top + l.h };
      }
      return s.name ? { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h } : { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    };
    return { labels, spots, buttons, boxes: labels.map((l, i) => boxOf(l, spots[i])), suggested, missing };
  };
  // La vue de départ que choisit la Carte (`reframeMap`, comme la scène), puis la pose entière, avec la reprise.
  const chosen = (level: (typeof LEVELS)[number], w: number, h: number, setting: number, shut?: string) => {
    const plan = planFor(level);
    const open = (shut ? plan.lands.filter((l) => l.id !== shut).flatMap((l) => l.places) : plan.lands[0].places).map((id) => plan.places.find((p) => p.id === id)!.center);
    const v = reframeMap(plan, w / h, open, (view) => layout(level, w, h, setting, view, false, shut).missing);
    return layout(level, w, h, setting, clampMap(plan, v, w / h, v.distance), true, shut);
  };

  for (const level of LEVELS)
    for (const [w, h] of SCREENS)
      for (const [text, setting] of Object.entries(TEXTS))
        it(`${level}, ${w} × ${h}, texte ${text} : chaque nom entier sur une ligne, près de son lieu, sur aucun autre ; les lieux pâles sans nom ; Kéo sur aucun nom ouvert`, () => {
          const { labels, spots, buttons, boxes, suggested } = chosen(level, w, h, setting);
          expect(labels.some((l) => l.kind === 'open' && !l.pale), 'un lieu ouvert à l’écran').toBe(true);
          labels.forEach((l, i) => {
            const s = spots[i];
            // Un lieu d'une terre fermée : sa pastille d'icône, jamais son nom.
            if (l.pale) expect(s.name, l.id).toBe(false);
            if (l.kind !== 'open' || !s.name) return;
            const r = boxes[i];
            // Entier dans l'écran, à `MAP_EDGE` des bords, hors des boutons, à 80 px au plus de son point.
            expect(r.left >= MAP_EDGE && r.top >= MAP_EDGE && r.right <= w - MAP_EDGE && r.bottom <= h - MAP_EDGE, l.id).toBe(true);
            for (const b of buttons) expect(clashes(r, b), `${l.id} sur un bouton`).toBe(false);
            expect(gapTo(l, r), l.id).toBeLessThanOrEqual(80);
            // Sur aucune autre étiquette : ni un nom, ni un cadenas, ni une pastille, ni Kéo (sa pastille ne touche pas même le
            // nom de son lieu : relecture des restes du 4e).
            labels.forEach((o, j) => {
              if (j === i) return;
              if (o.kind === 'keo' && l.id === ownOf(labels, o)) {
                expect(crosses(r, boxes[j]), `Kéo sur ${l.id}`).toBe(false);
                return;
              }
              // Une pastille d'icône, au pire, peut toucher un nom sans écart, jamais le couvrir.
              if (o.kind === 'open' && !spots[j].name) expect(crosses(r, boxes[j]), `${l.id} sous ${o.id}`).toBe(false);
              else expect(clashes(r, boxes[j]), `${l.id} sur ${o.id}`).toBe(false);
            });
          });
          // Le lieu suggéré, à l'écran, garde son nom.
          const next = labels.findIndex((l) => l.id === suggested);
          if (next >= 0) expect(spots[next].name, suggested).toBe(true);
        });

  // Relecture des restes du 4e (consultant UX UI, référent dys, consultant d'Archipéo) : les colonnes de boutons interdites
  // à toute étiquette ; Kéo sur aucune pastille ni aucun nom ; une pastille pâle coupée par aucun nom ; le nom d'une terre
  // fermée sous son cadenas, au plus grand texte aussi.
  // Au départ (toutes les terres fermées sauf une), sur tablette ; une seule terre fermée (comme le Bastion fermé du 4e),
  // sur tout écran. Au départ, en 390 × 844 (une fenêtre étroite d'ordinateur : l'appareil tactile en portrait demande
  // qu'on le tourne), quatre cadenas sur une île de 190 px de large : le nom d'une terre peut y monter au-dessus de son
  // cadenas ou se taire, le cadenas le dit.
  const CASES = LEVELS.flatMap((level) => [
    ...SCREENS.filter(([w]) => w >= 800).map(([w, h]) => ({ level, w, h, shut: undefined as string | undefined })),
    ...planFor(level).lands.slice(1).flatMap((land) => SCREENS.map(([w, h]) => ({ level, w, h, shut: land.id as string | undefined }))),
  ]);
  for (const { level, w, h, shut } of CASES)
      for (const [text, setting] of Object.entries(TEXTS))
        it(`${level}, ${shut ? `seule ${shut} fermée` : 'au départ'}, ${w} × ${h}, texte ${text} : rien sous un bouton, Kéo sur rien, aucune pastille couverte, chaque terre fermée nommée`, () => {
          const { labels, spots, buttons, boxes } = chosen(level, w, h, setting, shut);
          const what = (k: number) => `${labels[k].id} ${JSON.stringify(boxes[k])}`;
          labels.forEach((l, i) => {
            const r = boxes[i];
            // Hors des boutons : à un écart pour un nom, sans les couvrir pour une pastille ou un cadenas.
            const named = (l.kind === 'open' && spots[i].name) || (l.kind === 'closed' && spots[i].name);
            for (const b of buttons) expect(named ? clashes(r, b) : crosses(r, b), `${what(i)} sous un bouton`).toBe(false);
            if (l.kind === 'keo')
              labels.forEach((_, j) => {
                if (j !== i) expect(crosses(r, boxes[j]), `Kéo ${JSON.stringify(r)} sur ${what(j)}`).toBe(false);
              });
            if (l.pale)
              labels.forEach((o, j) => {
                if (j !== i && spots[j].name && o.kind !== 'keo') expect(crosses(r, boxes[j]), `${what(i)} coupée par ${what(j)}`).toBe(false);
              });
            // Une pastille d'icône sur aucune autre étiquette, pas même une autre pastille.
            if (l.kind === 'open' && !spots[i].name)
              labels.forEach((_, j) => {
                if (j !== i) expect(crosses(r, boxes[j]), `${what(i)} sur ${what(j)}`).toBe(false);
              });
            // Sous son cadenas, ou juste au-dessus en dernier recours (`drop` négatif), jamais tu.
            if (l.kind === 'closed') expect(spots[i].name, `${l.id} sans nom`).toBe(true);
          });
        });

  it('au téléphone en portrait, la bande des côtés en part de la largeur montre plus de lieux ouverts qu’une bande de 100 px', () => {
    for (const level of LEVELS) {
      const plan = planFor(level);
      const pose = mapPose(mapStart(plan, 390 / 844));
      const xs = plan.lands[0].places.map((id) => screenOf(pose, { ...plan.places.find((p) => p.id === id)!.center, y: 0 }, 390, 844).x);
      const inBand = (side: number) => xs.filter((x) => x > side && x < 390 - side).length;
      expect(inBand(mapLabelSide(390)), level).toBeGreaterThanOrEqual(inBand(100));
      expect(inBand(mapLabelSide(390)), level).toBe(xs.length);
    }
  });
});
