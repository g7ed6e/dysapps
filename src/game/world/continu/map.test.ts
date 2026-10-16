// La Carte des lieux ouverts du monde continu (piste 1, lot 3) : l'île entière à l'ouverture, glisser et pincer dans
// leurs limites, la pose de la caméra (nord en haut). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { markOffset, screenOf } from './camera';
import type { Vec3 } from './geometry';
import { ISLAND_BOX, MAP_BAR_ROOM, MAP_CAMERA, grown, MAP_COMPACT, MAP_KEO_DISC, MAP_LABEL_GAP, MAP_LOCK, MAP_REFRAME, clampMap, closedNoteText, fitDistance, layoutMapLabels, mapPose, mapStart, nameLines, panMap, placeClosedNote, reframeMap, zoomMap, type MapLabel, type MapLabelSpot, type MapView } from './map';
import { PLACES, placeById } from './plan6e';
import { PORT_MAP_POINT } from './port';
import { heightAt, standingHeight } from './terrain';

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

  it('au plus grand texte, la vue de départ change jusqu’à ce que chaque lieu ouvert ait son nom (GD-20, « La Carte au plus grand texte »)', () => {
    const aspect = 667 / 375;
    const start = mapStart(aspect);
    const open = [PLACES[0].center, PLACES[1].center];
    // Rien ne manque : l'île entière, sans rien essayer d'autre (le texte normal ne change pas).
    let tried = 0;
    expect(reframeMap(aspect, open, () => (tried++, 0))).toEqual(start);
    expect(tried).toBe(1);
    // Il manque un nom à l'île entière, plus rien un peu plus loin : la vue la plus proche de l'île entière qui suffit.
    const farther = reframeMap(aspect, open, (v) => (v.distance > start.distance * 1.15 ? 0 : 100));
    expect(farther.distance).toBeGreaterThan(start.distance * 1.15);
    expect(farther.distance).toBeLessThan(start.distance * 1.15 * MAP_REFRAME.step + 1e-6);
    // Plus près, centrée sur les lieux ouverts.
    const closer = reframeMap(aspect, open, (v) => (v.distance < start.distance / 1.3 ? 0 : 100));
    expect(closer.distance).toBeLessThan(start.distance / 1.3);
    expect(closer.distance).toBeGreaterThanOrEqual(start.distance / MAP_REFRAME.most - 1e-6);
    expect(closer.x).toBeCloseTo((Math.min(open[0].x, open[1].x) + Math.max(open[0].x, open[1].x)) / 2, 6);
    // Rien ne suffit : celle à qui il manque le moins, la plus proche de l'île entière ; jamais au-delà de la portée.
    const seen: MapView[] = [];
    const best = reframeMap(aspect, open, (v) => (seen.push(v), v.distance > start.distance * 1.5 ? 10 : 100));
    expect(best.distance).toBeGreaterThan(start.distance * 1.5);
    expect(best.distance).toBeLessThan(start.distance * 1.5 * MAP_REFRAME.step + 1e-6);
    for (const v of seen) {
      expect(v.distance).toBeLessThanOrEqual(start.distance * MAP_REFRAME.most + 1e-6);
      expect(v.distance).toBeGreaterThanOrEqual(start.distance / MAP_REFRAME.most - 1e-6);
    }
  });

  it('reculée, la Carte garde sa distance la plus lointaine au glisser et au pincer', () => {
    const aspect = 844 / 390;
    const fit = fitDistance(aspect);
    const back = { ...mapStart(aspect), distance: fit * 1.4 };
    expect(clampMap(back, aspect).distance).toBeCloseTo(fit, 6);
    expect(clampMap(back, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    expect(panMap(back, 5, 0, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    expect(zoomMap(back, 0.5, back, aspect, fit * 1.4).distance).toBeCloseTo(fit * 1.4, 6);
    // Une distance la plus lointaine plus proche que l'île entière ne l'empêche pas de se voir entière.
    expect(clampMap(back, aspect, fit / 2).distance).toBeCloseTo(fit, 6);
  });
});

describe('Les noms sur deux lignes', () => {
  it('se coupent entre deux mots, ou après un article élidé, à la coupure la plus équilibrée ; un seul mot reste entier', () => {
    expect(nameLines('Le Chantier naval')).toEqual(['Le Chantier', 'naval']);
    expect(nameLines('Les Marais salants')).toEqual(['Les Marais', 'salants']);
    expect(nameLines('La Turbine')).toEqual(['La', 'Turbine']);
    expect(nameLines('L’Observatoire')).toEqual(['L’', 'Observatoire']);
    expect(nameLines('La Gare maritime')).toEqual(['La Gare', 'maritime']);
    expect(nameLines('Phare')).toEqual(['Phare']);
    // Les lignes redonnent le nom, lettre pour lettre.
    for (const p of PLACES) expect(nameLines(p.name).join(' ').replace('’ ', '’')).toBe(p.name);
  });
});

describe('Les étiquettes de la Carte', () => {
  const boxOf = (l: MapLabel, s: MapLabelSpot) => {
    if (l.kind === 'closed' && !s.name) return { left: l.x - MAP_LOCK / 2, top: s.top, right: l.x + MAP_LOCK / 2, bottom: s.top + MAP_LOCK };
    if (l.kind === 'keo' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_KEO_DISC, bottom: s.top + l.h };
    if (l.kind === 'open' && !s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    if (l.kind === 'open' && s.narrow) return { left: s.left, top: s.top, right: s.left + l.narrow!.w, bottom: s.top + l.narrow!.h };
    if (l.kind === 'closed' && s.narrow) {
      const name = l.x - l.narrow!.w / 2 + (s.shift ?? 0);
      return { left: Math.min(name, l.x - MAP_LOCK / 2), top: s.top, right: Math.max(name + l.narrow!.w, l.x + MAP_LOCK / 2), bottom: s.top + l.narrow!.h + (s.drop ?? 0) };
    }
    if (l.kind === 'closed') {
      // Le cadenas, et son nom dessous, glissé de `shift`.
      const name = s.left + (s.shift ?? 0);
      return { left: Math.min(name, l.x - MAP_LOCK / 2), top: s.top, right: Math.max(name + l.w, l.x + MAP_LOCK / 2), bottom: s.top + l.h };
    }
    return { left: s.left, top: s.top, right: s.left + l.w, bottom: s.top + l.h };
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

  it('téléphone couché au plus grand texte : six lieux ouverts serrés, décalés, sur deux lignes ou plus loin, chacun avec son nom, jamais sur la colonne ni l’un sur l’autre', () => {
    const screen = { width: 667, height: 375 };
    // La bande de gauche réservée (72 px), « Retour » en bas à gauche, Réglages en haut à droite.
    const zones = [
      { left: 0, top: 0, right: 72, bottom: 375 },
      { left: 10, top: 280, right: 130, bottom: 365 },
      { left: 600, top: 10, right: 657, bottom: 66 },
    ];
    const narrow = { w: 130, h: 96 };
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 300, y: 240, w: 120, h: 50 },
      { id: 'phare', kind: 'open', x: 120, y: 150, w: 210, h: 56, narrow },
      { id: 'quais', kind: 'open', x: 330, y: 230, w: 210, h: 56, narrow },
      { id: 'filets', kind: 'open', x: 300, y: 120, w: 220, h: 56, narrow },
      { id: 'ecluses', kind: 'open', x: 420, y: 110, w: 250, h: 56, narrow },
      { id: 'saltworks', kind: 'open', x: 560, y: 190, w: 290, h: 56, narrow },
      { id: 'engine', kind: 'open', x: 520, y: 150, w: 220, h: 56, narrow },
    ];
    const spots = layoutMapLabels(labels, zones, screen);
    const boxes = labels.map((l, i) => boxOf(l, spots[i]));
    for (let i = 1; i < boxes.length; i++) {
      expect(spots[i].name, labels[i].id).toBe(true);
      for (const z of zones) expect(apart(boxes[i], z), `${labels[i].id} ${JSON.stringify(boxes[i])} ${JSON.stringify(spots[i])}`).toBe(true);
      for (let j = i + 1; j < boxes.length; j++) expect(apart(boxes[i], boxes[j]), `${labels[i].id} ${labels[j].id}`).toBe(true);
      expect(boxes[i].right).toBeLessThanOrEqual(667);
      expect(boxes[i].bottom).toBeLessThanOrEqual(375);
    }
    // Au moins un s'est serré : sans sa pastille serrée, il n'avait pas de place.
    expect(spots.some((s) => s.narrow)).toBe(true);
  });

  it('un lieu ouvert ne perd jamais son nom : sans place pour sa pastille entière, il passe sur deux lignes, plus étroit, hors des cadenas (relecture de L6b)', () => {
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
      { id: 'shipyard', kind: 'open', x: 455, y: 300, w: 250, h: 82, narrow: { w: 150, h: 104 } },
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
    // Sans sa forme serrée mesurée, il garde quand même son nom.
    expect(layoutMapLabels(labels.map((l) => (l.id === 'shipyard' ? { ...l, narrow: undefined } : l)), zones, screen)[4].name).toBe(true);
  });

  it('nulle part sans toucher une autre étiquette : la pastille se réduit à son icône, jamais un nom sur un autre', () => {
    const screen = { width: 400, height: 200 };
    const big = { w: 300, h: 150, narrow: { w: 260, h: 150 } };
    const labels: MapLabel[] = [
      { id: 'port', kind: 'open', x: 200, y: 100, ...big, first: true },
      { id: 'phare', kind: 'open', x: 210, y: 110, ...big },
    ];
    const spots = layoutMapLabels(labels, [], screen);
    expect(spots[0].name).toBe(true);
    expect(spots[1].name).toBe(false);
    expect(apart(boxOf(labels[0], spots[0]), boxOf(labels[1], spots[1]))).toBe(true);
  });

  it('l’Escale passe en premier : serrée, elle garde sa pastille entière, les autres lieux se serrent d’abord', () => {
    const screen = { width: 667, height: 375 };
    const zones = [
      { left: 0, top: 0, right: 72, bottom: 375 },
      { left: 10, top: 280, right: 130, bottom: 365 },
    ];
    const narrow = { w: 150, h: 100 };
    const crowd: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 330, y: 300, w: 120, h: 50 },
      { id: 'phare', kind: 'open', x: 330, y: 200, w: 260, h: 70, narrow },
      { id: 'quais', kind: 'open', x: 420, y: 240, w: 260, h: 70, narrow },
      { id: 'filets', kind: 'open', x: 300, y: 110, w: 260, h: 70, narrow },
      { id: 'ecluses', kind: 'open', x: 470, y: 120, w: 300, h: 70, narrow },
    ];
    const port: MapLabel = { id: 'port', kind: 'open', x: 340, y: 330, w: 260, h: 70, narrow };
    const all = (first: boolean) => layoutMapLabels([...crowd, { ...port, first }], zones, screen);
    const last = (first: boolean) => all(first).find((s) => s.id === 'port')!;
    expect(last(true).narrow).toBeUndefined();
    expect(last(true).name).toBe(true);
    // Tous gardent leur nom, les autres serrés au besoin.
    for (const s of all(true)) if (s.id !== 'keo') expect(s.name, s.id).toBe(true);
    expect(all(true).some((s) => s.narrow)).toBe(true);
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
    expect(keo).toEqual({ id: 'keo', left: 46, top: 256, name: true });
    expect(phare).toEqual({ id: 'phare', left: 430, top: 250, name: true });
    expect(quais.name).toBe(true);
    expect(quais.top).toBe(500 - MAP_LOCK);
  });

  it('« Toi » ne touche jamais un cadenas : Kéo garde alors sa pastille seule, à un écart du cadenas (relecture de L6a)', () => {
    // Le téléphone couché (tel844-carte) : Kéo devant la Turbine, le cadenas des Marais salants juste à droite.
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 570, y: 212, w: 108, h: 44 },
      { id: 'saltworks', kind: 'closed', x: 627, y: 227, w: 200, h: 84 },
    ];
    const [keo] = layoutMapLabels(labels, [], { width: 844, height: 390 });
    expect(keo.name).toBe(false);
    const right = keo.left + MAP_KEO_DISC;
    expect(right + MAP_LABEL_GAP).toBeLessThanOrEqual(627 - MAP_LOCK / 2);
    // Loin de tout cadenas, « Toi » reste.
    expect(layoutMapLabels([labels[0]], [], { width: 844, height: 390 })[0].name).toBe(true);
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

  it('sur la tablette, le nom d’un lieu fermé passe sur deux lignes plutôt que de se taire (GD-20, « La Carte au plus grand texte »)', () => {
    // Au plus grand texte : « Les Marais salants » sur une ligne (496 px) ne tient pas entre un bouton à gauche et le
    // bord droit de l'écran.
    const labels: MapLabel[] = [
      { id: 'phare', kind: 'open', x: 900, y: 300, w: 200, h: 78 },
      { id: 'saltworks', kind: 'closed', x: 700, y: 449, w: 496, h: 107, narrow: { w: 234, h: 161 } },
    ];
    const button = { left: 0, top: 440, right: 600, bottom: 560 };
    const screen = { width: 1024, height: 768 };
    const [phare, salt] = layoutMapLabels(labels, [button], screen);
    expect(phare.name).toBe(true);
    expect(salt.name).toBe(true);
    expect(salt.narrow).toBe(true);
    // L'élément, centré sur son cadenas, a la largeur de sa forme serrée ; le cadenas reste au-dessus de son nom.
    expect(salt.left).toBe(700 - 234 / 2);
    const left = 700 - 234 / 2 + (salt.shift ?? 0);
    expect(left).toBeLessThanOrEqual(700 - MAP_LOCK / 2);
    expect(left + 234).toBeGreaterThanOrEqual(700 + MAP_LOCK / 2);
    const name = { left, top: 449 + (salt.drop ?? 0), right: left + 234, bottom: 449 + (salt.drop ?? 0) + 161 - MAP_LOCK };
    expect(apart(name, boxOf(labels[0], phare))).toBe(true);
    expect(apart(name, button)).toBe(true);
    // Sans forme serrée mesurée, il passe au-dessus de son cadenas, collé à lui (relecture de L9) ; là aussi pris, il se tait.
    const risen = layoutMapLabels([labels[0], { ...labels[1], narrow: undefined }], [button], screen)[1];
    expect(risen.name).toBe(true);
    expect(449 + risen.drop! + 107 - MAP_LOCK).toBeLessThanOrEqual(449 - MAP_LOCK);
    const roof = { left: 0, top: 0, right: 1024, bottom: 400 };
    expect(layoutMapLabels([labels[0], { ...labels[1], narrow: undefined }], [button, roof], screen)[1].name).toBe(false);
  });

  it('un nom ne s’éloigne pas de plus de 80 px de son lieu ; plus loin, un lieu ouvert se serre d’abord (relecture du rivage sud)', () => {
    // Le Phare ouvert, entre deux boutons : sa pastille entière (260 px) ne passe pas entre eux, sa pastille serrée si.
    const screen = { width: 667, height: 375 };
    const at = { x: 330, y: 190 };
    const buttons = [
      { left: 0, top: 0, right: 200, bottom: 375 },
      { left: 460, top: 0, right: 667, bottom: 375 },
    ];
    const phare: MapLabel = { id: 'phare', kind: 'open', ...at, w: 260, h: 60, narrow: { w: 110, h: 90 } };
    const spots = layoutMapLabels([phare], buttons, screen);
    const [spot] = spots;
    expect(spot.name).toBe(true);
    expect(spot.narrow).toBe(true);
    const box = boxOf(phare, spot);
    const gap = Math.hypot(Math.max(box.left - at.x, 0, at.x - box.right), Math.max(box.top - at.y, 0, at.y - box.bottom));
    expect(gap).toBeLessThanOrEqual(80);
  });

  it('nulle part près de son lieu : un lieu ouvert se réduit à son icône plutôt que son nom aille à plus de 80 px (GD-20, portée refusée)', () => {
    const screen = { width: 700, height: 400 };
    // Une barre de boutons sur tout le milieu de l'écran, le lieu dessous : de la place loin de lui, en haut et en bas.
    const bar = { left: 0, top: 100, right: 700, bottom: 300 };
    const label: MapLabel = { id: 'phare', kind: 'open', x: 350, y: 200, w: 200, h: 60, narrow: { w: 120, h: 90 } };
    const [spot] = layoutMapLabels([label], [bar], screen);
    expect(spot.name).toBe(false);
  });

  it('le nom d’un lieu ouvert, près de son lieu, passe avant celui d’un lieu fermé (GD-20, directeur artistique)', () => {
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
    const [quais, phare] = layoutMapLabels(labels, walls, screen);
    expect(phare.name).toBe(true);
    expect(quais.name).toBe(false);
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
  const narrow = { w: 150, h: 84 };
  const labelsOn = (w: number, h: number, view = mapStart(w / h)): MapLabel[] => {
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
        return { id: p.id, kind: open.has(p.id) ? 'open' : 'closed', x: s.x, y: s.y, w: lw, h: lh, ...(open.has(p.id) ? { narrow } : {}) };
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
    if (l.kind === 'keo') return { left: s.left, top: s.top, right: s.left + (s.name ? l.w : MAP_KEO_DISC), bottom: s.top + l.h };
    if (!s.name) return { left: s.left, top: s.top, right: s.left + MAP_COMPACT, bottom: s.top + MAP_COMPACT };
    const [bw, bh] = s.narrow ? [l.narrow!.w, l.narrow!.h] : [l.w, l.h];
    return { left: s.left, top: s.top, right: s.left + bw, bottom: s.top + bh };
  };
  const overlap = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  for (const [w, h] of [[1024, 768], [844, 390]] as const) {
    it(`${w} × ${h} : chaque lieu ouvert du rivage nord garde son nom, jamais sur un cadenas, sur « Toi » ni sur un autre nom`, () => {
      // La vue de départ que choisit la Carte (`reframeMap`, comme la scène) : les lieux hors de la zone des étiquettes
      // n'en ont pas (`mapShown`, scene.ts : 100 px des côtés, 64 px du haut, 24 px du bas) ; ce qui manque est pesé
      // comme `crowded` (MapLabels.tsx, `MISSING`) : 100 par lieu ouvert sans nom ou hors de la zone, 1 par lieu fermé
      // hors de la zone sur tablette (plus de 500 px de haut).
      const inside = (l: MapLabel) => l.x > 100 && l.x < w - 100 && l.y > 64 && l.y < h - 24;
      const ground = PLACES.filter((p) => open.has(p.id)).map((p) => p.center);
      const chosen = reframeMap(w / h, [...ground, PORT_MAP_POINT], (v) => {
        const all = labelsOn(w, h, v);
        const shown = all.filter(inside);
        const gone = all.filter((l) => l.kind !== 'keo' && !inside(l)).reduce((n, l) => n + (l.kind === 'open' ? 100 : h > 500 ? 1 : 0), 0);
        const spots = layoutMapLabels(shown, [], { width: w, height: h }, false);
        return gone + 100 * spots.filter((s, i) => shown[i].kind === 'open' && !s.name).length;
      });
      const view = clampMap(chosen, w / h, chosen.distance);
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

describe('« [Nom] : fermé pour l’instant » (GD-20, « La Carte au plus grand texte »)', () => {
  const screen = { width: 667, height: 375 };
  const size = { w: 220, h: 60 };
  const cross = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  it('s’écrit sous le cadenas touché, entier dans l’écran', () => {
    const at = { x: 640, y: 150 };
    const spot = placeClosedNote(at, [size], [], [], screen);
    expect(spot.top).toBe(150 + MAP_LABEL_GAP);
    expect(spot.left + size.w).toBeLessThanOrEqual(667 - MAP_LABEL_GAP);
  });
  it('jamais sur « Retour » ni sur « Toi » : au-dessus du cadenas, ou en bas de l’écran', () => {
    const retour = { left: 10, top: 290, right: 130, bottom: 365 };
    const toi = { left: 260, top: 200, right: 380, bottom: 250 };
    const above = placeClosedNote({ x: 320, y: 190 }, [size], [], [retour, toi], screen);
    expect(cross({ left: above.left, top: above.top, right: above.left + size.w, bottom: above.top + size.h }, toi)).toBe(false);
    expect(above.top + size.h).toBeLessThanOrEqual(190 - MAP_LOCK);
    // Ni dessous, ni dessus, ni à côté : le long du bas de l'écran, hors de « Retour ».
    const wall = { left: 0, top: 0, right: 667, bottom: 290 };
    const low = placeClosedNote({ x: 320, y: 190 }, [size], [wall], [retour], screen);
    const box = { left: low.left, top: low.top, right: low.left + size.w, bottom: low.top + size.h };
    expect(box.bottom).toBeLessThanOrEqual(375);
    expect(cross(box, retour)).toBe(false);
    expect(cross(box, wall)).toBe(false);
    // Aucune place hors des autres boutons : il peut en couvrir un, jamais « Retour » ni « Toi ».
    const full = { left: 0, top: 0, right: 667, bottom: 375 };
    const last = placeClosedNote({ x: 320, y: 190 }, [size], [full], [retour, toi], screen);
    const lastBox = { left: last.left, top: last.top, right: last.left + size.w, bottom: last.top + size.h };
    expect(cross(lastBox, retour)).toBe(false);
    expect(cross(lastBox, toi)).toBe(false);
  });
  it('trop large pour une place près du cadenas : il passe sur une bande, en bas ou en haut, sur deux ou trois lignes, jamais sur « Retour », « Toi » ni un nom ouvert', () => {
    // Le téléphone couché au plus grand texte : « Retour » en bas à gauche, « Toi » au milieu, un nom ouvert en haut à
    // gauche ; la forme large ne passe ni au-dessus de « Toi » ni entre lui et « Retour ».
    const retour = { left: 20, top: 285, right: 200, bottom: 365 };
    const toi = { left: 290, top: 100, right: 340, bottom: 144 };
    const phare = { left: 90, top: 20, right: 260, bottom: 120 };
    const wide = { w: 534, h: 132 };
    const band = { w: 440, h: 132, band: true };
    const tall = { w: 300, h: 190, band: true };
    const spot = placeClosedNote({ x: 330, y: 200 }, [wide, band, tall], [], [retour, toi], screen, [phare]);
    expect(spot.form).toBe(1);
    const box = { left: spot.left, top: spot.top, right: spot.left + band.w, bottom: spot.top + band.h };
    // Le long du bas de l'écran, à droite de « Retour ».
    expect(box.bottom).toBe(375 - MAP_LABEL_GAP);
    for (const r of [retour, toi, phare]) expect(cross(box, r)).toBe(false);
  });
  it('une bande se pose en bas ou en haut de l’écran ; au milieu en dernier recours seulement, jamais sur « Retour » ni « Toi »', () => {
    const band = { w: 440, h: 100, band: true };
    // Le cadenas au milieu, tout près de lui occupé : la bande en bas.
    const around = { left: 200, top: 120, right: 470, bottom: 250 };
    const low = placeClosedNote({ x: 330, y: 200 }, [{ w: 600, h: 60 }, band], [around], [], screen);
    expect(low.form).toBe(1);
    expect(low.top).toBe(375 - MAP_LABEL_GAP - band.h);
    // Le haut et le bas pris par « Toi » et « Retour » : au milieu, hors d'eux.
    const wall = { left: 0, top: 0, right: 667, bottom: 120 };
    const floor = { left: 0, top: 250, right: 667, bottom: 375 };
    const mid = placeClosedNote({ x: 330, y: 200 }, [band], [], [wall, floor], screen);
    const box = { left: mid.left, top: mid.top, right: mid.left + band.w, bottom: mid.top + band.h };
    expect(cross(box, wall)).toBe(false);
    expect(cross(box, floor)).toBe(false);
  });
  it('sans place libre : jamais sur « Retour » ni « Toi », et le moins possible sur un nom ouvert', () => {
    const retour = { left: 20, top: 285, right: 200, bottom: 365 };
    const toi = { left: 290, top: 60, right: 340, bottom: 104 };
    const escale = { left: 215, top: 280, right: 345, bottom: 355 };
    const phare = { left: 113, top: 90, right: 282, bottom: 255 };
    const band = { w: 420, h: 132, band: true };
    const spot = placeClosedNote({ x: 380, y: 100 }, [{ w: 534, h: 132 }, band], [], [retour, toi], screen, [escale, phare]);
    const size = spot.form ? band : { w: 534, h: 132 };
    const box = { left: spot.left, top: spot.top, right: spot.left + size.w, bottom: spot.top + size.h };
    expect(cross(box, retour)).toBe(false);
    expect(cross(box, toi)).toBe(false);
    // L'Escale, la pastille la plus proche du bas, n'est couverte qu'en partie au plus.
    const covered = (r: typeof box) => Math.max(0, Math.min(box.right, r.right) - Math.max(box.left, r.left)) * Math.max(0, Math.min(box.bottom, r.bottom) - Math.max(box.top, r.top));
    expect(covered(escale) + covered(phare)).toBeLessThan((escale.right - escale.left) * (escale.bottom - escale.top));
  });
});

describe('le mot d’un lieu fermé (GD-20, téléphone au plus grand texte)', () => {
  it('ailleurs, le mot long, écrit et dit', () => {
    expect(closedNoteText('Les Marais salants', false)).toEqual({ shown: 'Les Marais salants\u00a0: fermé pour l’instant' });
  });
  it('sur téléphone au plus grand texte, le mot court écrit ; la voix garde la phrase entière du bouton', () => {
    expect(closedNoteText('Les Marais salants', true)).toEqual({
      shown: 'Les Marais salants\u00a0: fermé',
      said: 'Les Marais salants : sous la brume, fermé pour l’instant',
    });
  });
  it('la ligne ne commence jamais par les deux-points', () => {
    for (const short of [false, true]) expect(closedNoteText('Les Quais', short).shown).toMatch(/^Les Quais\u00a0:/u);
  });
});

describe('« Retour » et « Lieux » (relecture de L9)', () => {
  it('aucun nom à moins de 16 px de la barre du bas, Kéo devant son lieu', () => {
    const screen = { width: 1024, height: 768 };
    const bar = { left: 10, top: 686, right: 420, bottom: 752 };
    const labels: MapLabel[] = [
      { id: 'keo', kind: 'keo', x: 236, y: 620, w: 108, h: 44 },
      { id: 'ferry', kind: 'open', x: 232, y: 620, w: 250, h: 48, narrow: { w: 172, h: 84 } },
    ];
    const [, spot] = layoutMapLabels(labels, [grown(bar, MAP_BAR_ROOM)], screen);
    expect(spot.name).toBe(true);
    const bottom = spot.top + (spot.narrow ? 84 : 48);
    const right = spot.left + (spot.narrow ? 172 : 250);
    const gap = Math.max(bar.top - bottom, spot.left - bar.right, bar.left - right);
    expect(gap).toBeGreaterThanOrEqual(16);
  });
});

describe('La reprise des noms fermés tus (relecture de L9)', () => {
  const screen = { width: 1024, height: 768 };
  // Un lieu fermé tu sous un autre lieu fermé dont le nom, haut et étroit, couvre toutes ses places (quatorze : sept
  // pour chacune de ses deux formes) : garder l'une d'elles fait taire le nom du dessus, la reprise la refuse.
  const pair = (id: string, x: number): MapLabel[] => [
    { id: `${id}-haut`, kind: 'closed', x: x + 58, y: 50, w: 60, h: 264 },
    { id, kind: 'closed', x, y: 150, w: 100, h: 84, narrow: { w: 80, h: 84 } },
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

  it('un nom ouvert ne s’échange pas contre un nom fermé', () => {
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
    const spots = layoutMapLabels(last, walls, screen);
    expect(named(spots, 'ouvert')).toBe(true);
    expect(named(spots, 'dernier')).toBe(false);
  });
});
