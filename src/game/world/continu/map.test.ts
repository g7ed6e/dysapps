// La Carte des lieux ouverts du monde continu (piste 1, lot 3) : l'île entière à l'ouverture, glisser et pincer dans
// leurs limites, la pose de la caméra (nord en haut). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { screenOf } from './camera';
import { ISLAND_BOX, MAP_CAMERA, MAP_COMPACT, MAP_KEO_DISC, MAP_LABEL_GAP, MAP_LOCK, clampMap, fitDistance, layoutMapLabels, mapPose, mapStart, panMap, zoomMap, type MapLabel, type MapLabelSpot } from './map';
import { PLACES } from './plan6e';

const screens = [
  [1024, 768],
  [768, 1024],
  [844, 390],
  [667, 375],
] as const;

describe('La Carte des lieux ouverts', () => {
  it('s’ouvre sur l’île entière : les six lieux et les bords de l’île à l’écran, nord en haut', () => {
    for (const [w, h] of screens) {
      const pose = mapPose(mapStart(w / h));
      const at = `${w}×${h}`;
      for (const p of PLACES) {
        const s = screenOf(pose, { x: p.center.x, y: 0, z: p.center.z }, w, h);
        expect(s.x, at).toBeGreaterThan(0);
        expect(s.x, at).toBeLessThan(w);
        expect(s.y, at).toBeGreaterThan(0);
        expect(s.y, at).toBeLessThan(h);
      }
      const { minX, maxX, minZ, maxZ } = ISLAND_BOX;
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
    const start = mapStart(aspect);
    const toward = PLACES[0].center;
    const near = zoomMap(start, 2, toward, aspect);
    expect(near.distance).toBeCloseTo(start.distance / 2, 6);
    // Le point sous les doigts se rapproche du milieu, à la même part.
    expect(near.x - toward.x).toBeCloseTo((start.x - toward.x) / 2, 6);
    expect(zoomMap(start, 1000, toward, aspect).distance).toBe(MAP_CAMERA.closest);
    expect(zoomMap(start, 0.001, toward, aspect).distance).toBeCloseTo(fitDistance(aspect), 6);
  });

  it('se glisse sans quitter l’île', () => {
    const aspect = 844 / 390;
    const start = mapStart(aspect);
    const moved = panMap(start, 10, -5, aspect);
    expect(moved.x).toBeCloseTo(start.x + 10, 6);
    expect(moved.z).toBeCloseTo(start.z - 5, 6);
    const far = panMap(start, 1e4, -1e4, aspect);
    expect(far.x).toBe(ISLAND_BOX.maxX);
    expect(far.z).toBe(ISLAND_BOX.minZ);
    expect(clampMap(far, aspect)).toEqual(far);
  });
});

describe('Les étiquettes de la Carte', () => {
  const boxOf = (l: MapLabel, s: MapLabelSpot) => {
    if (l.kind === 'closed' && !s.name) return { left: l.x - MAP_LOCK / 2, top: s.top, right: l.x + MAP_LOCK / 2, bottom: s.top + MAP_LOCK };
    if (l.kind === 'keo' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_KEO_DISC, bottom: s.top + l.h };
    if (l.kind === 'open' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    return { left: s.left, top: s.top, right: s.left + Math.max(l.kind === 'closed' ? MAP_LOCK : 0, l.w), bottom: s.top + l.h };
  };
  const apart = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) =>
    a.right + MAP_LABEL_GAP <= b.left || b.right + MAP_LABEL_GAP <= a.left || a.bottom + MAP_LABEL_GAP <= b.top || b.bottom + MAP_LABEL_GAP <= a.top;

  it('aucune étiquette n’en recouvre une autre, même Kéo devant son lieu, dans l’écran et hors des boutons', () => {
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
    for (let i = 0; i < boxes.length; i++) {
      expect(apart(boxes[i], retour), labels[i].id).toBe(true);
      for (let j = i + 1; j < boxes.length; j++) expect(apart(boxes[i], boxes[j]), `${labels[i].id} ${labels[j].id}`).toBe(true);
    }
    const phare = boxes[1];
    expect(phare.left).toBeGreaterThanOrEqual(0);
    expect(phare.top).toBeGreaterThanOrEqual(0);
    // Le cadenas d'un lieu fermé reste toujours ; son nom se tait s'il gêne.
    expect(spots[2].top).toBe(278 - MAP_LOCK);
  });

  it('téléphone couché au plus grand texte : six lieux serrés, décalés ou réduits à leur icône, jamais sur la colonne ni l’un sur l’autre', () => {
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
      expect(boxes[i].right).toBeLessThanOrEqual(667);
      expect(boxes[i].bottom).toBeLessThanOrEqual(375);
    }
  });

  it('l’Escale passe en premier : serrée, elle garde son nom, les autres lieux se réduisent d’abord à leur icône', () => {
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
    const last = (first: boolean) => layoutMapLabels([...crowd, { ...port, first }], zones, screen).find((s) => s.id === 'port')!;
    expect(last(true).name).toBe(true);
    // Sans priorité, posée après les autres, elle n'aurait gardé que son icône : c'est bien l'ordre qui la sauve.
    expect(last(false).name).toBe(false);
  });

  it('au large, chaque nom se pose au-dessus de son lieu, Kéo et « Toi » à sa place, les noms des lieux fermés sous leur cadenas', () => {
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 100, y: 300, w: 108, h: 44 },
      { id: 'phare', kind: 'open', x: 500, y: 300, w: 140, h: 50 },
      { id: 'quais', kind: 'closed', x: 800, y: 500, w: 130, h: 84 },
    ];
    const [keo, phare, quais] = layoutMapLabels(labels, [], { width: 1024, height: 768 });
    expect(keo).toEqual({ id: 'keo', left: 46, top: 256, name: true });
    expect(phare).toEqual({ id: 'phare', left: 430, top: 250, name: true });
    expect(quais.name).toBe(true);
    expect(quais.top).toBe(500 - MAP_LOCK);
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
});
