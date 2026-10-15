// Les poignées du mode « Modifier le plan » dans le monde (GD-9, intention du directeur artistique du 6 octobre 2026) :
// chacune de son côté, sur l'eau, à une place du bord de l'emprise du choix ; « Tourner » au coin nord-est (un autre
// coin si son radeau y tomberait sur un autre lieu) et seulement pour ce qui tourne ; indisponible au bord de la carte ; sans se toucher à aucune échelle ; leur forme sous le budget
// (400 triangles, un appel), sans le jaune des places libres ; la croix grise d'une place prise.
import { describe, expect, it } from 'vitest';
import { currentLandings, DIRECTION_STEP, othersFootprintsOf, placeTurns, routesIn, spotOf } from './arrange';
import { ARCHIPELAGO_IDS } from './archipelagos';
import {
  bordDeLaCroix,
  type CoinDuChoix,
  coinDeTournerDe,
  BUDGET_DES_POIGNEES,
  POIGNEE_MIN_PX,
  ECHELLES,
  CLES_DES_POIGNEES,
  COTE_DU_RADEAU,
  COULEURS_DES_POIGNEES,
  coutDesPoignees,
  formeDesPoignees,
  ecartVersLaPlace,
  placerALEchelle,
  sortDeLaPlace,
} from './arrangeHandles';
import { type ArrangeChoice, choiceFits, chooseIsland, chooseStation } from './arrangeMode';
import { arrangeView } from './arrangeView';
import { toutConstruit } from './budget';
import { mapOf } from './map';
import { questStations } from './terrain/markers';

const { world } = toutConstruit();
const lieux = mapOf('6e').map((d) => d.id);
const unLieu = lieux.map((id) => chooseIsland(world, id)).find((c) => c !== null)!;
const NORD_EST: CoinDuChoix = { dx: DIRECTION_STEP.est.dx, dy: DIRECTION_STEP.nord.dy };

describe('les poignées autour du choix', () => {
  it('un lieu : seul « Tourner », au coin nord-est d’ordinaire, hors de l’emprise du fantôme ; aucune flèche (« trop de boutons », 7 octobre 2026)', () => {
    const v = arrangeView(world, unLieu);
    const p = v.poignees!;
    expect(p.liste.map((q) => q.cle)).toEqual(['tourner']);
    const r = v.cadre!.rect;
    const [q] = p.liste;
    const x = p.cx + q.ox;
    const y = p.cy + q.oy;
    const demi = COTE_DU_RADEAU / 2;
    // Hors de l'emprise, d'au moins une place.
    expect(x + demi <= r.x0 - 1 + 1e-9 || x - demi >= r.x1 + 1 - 1e-9 || y + demi <= r.y0 - 1 + 1e-9 || y - demi >= r.y1 + 1 - 1e-9).toBe(true);
    // Au coin nord-est d'ordinaire : ailleurs seulement quand son radeau y tomberait sur un autre lieu (les tests suivants).
    const ailleurs = lieux.filter((id) => {
      const c = chooseIsland(world, id);
      const t = c && arrangeView(world, c).poignees!.liste[0];
      return t && !(Math.sign(t.ox) === NORD_EST.dx && Math.sign(t.oy) === NORD_EST.dy);
    });
    // Le Volcan et le Préau des délégués (EMC-2) s'y ajoutent : le Préau est leur voisin au nord-est.
    expect(ailleurs).toEqual(['french-6e-grammar-spelling', 'french-6e-letter-confusion', 'french-6e-word-spelling', 'maths-6e-decimals', 'physics-chemistry-6e-matter-energy', 'civics-6e-democratic-society']);
  });

  it('« Tourner » : un voisin au coin nord-est, il passe au coin libre le plus proche du lieu choisi ; puis il garde son coin tant qu’il n’y gêne pas', () => {
    // Le Comptoir (5e) : à son coin nord-est, à l'échelle de la Carte, son radeau se poserait sur un voisin.
    const comptoir = chooseIsland(world, 'english-5e-vocabulary')!;
    const ici = (c: ArrangeChoice, garde: CoinDuChoix | null) => coinDeTournerDe(arrangeView(world, c, false, garde).poignees);
    expect(ici(comptoir, null)).not.toEqual(NORD_EST);
    // Il le reste même si le nord-est était son coin : il y gênerait.
    expect(ici(comptoir, NORD_EST)).toEqual(ici(comptoir, null));
    // Le Carrefour (5e) : le nord-est est libre, et trois autres coins aussi.
    const carrefour = chooseIsland(world, 'french-5e-homophones')!;
    expect(ici(carrefour, null)).toEqual(NORD_EST);
    // « Toujours au même endroit » : un coin libre qu'il occupait déjà, il le garde, même si le nord-est l'est aussi.
    const sudEst = { dx: NORD_EST.dx, dy: -NORD_EST.dy };
    expect(ici(carrefour, sudEst)).toEqual(sudEst);
    // Un coin qui gêne, il le quitte : le coin sud-ouest du Carrefour tombe sur un voisin.
    expect(ici(carrefour, { dx: -NORD_EST.dx, dy: -NORD_EST.dy })).toEqual(NORD_EST);
  });

  it('« Tourner » ne se pose jamais sur la terre d’un autre lieu : il passe à un autre coin (GD-12, relecture du 9 octobre 2026)', () => {
    // Vu au 3e, sur la première construction de ses formes (le Tremplin des forces choisi, son radeau se posait sur la
    // Ruche des réseaux) ; au 5e, le Comptoir (le test précédent).
    for (const a of ARCHIPELAGO_IDS)
      for (const d of mapOf(a)) {
        const c = chooseIsland(world, d.id);
        if (!c) continue;
        const p = arrangeView(world, c).poignees!;
        const autres = othersFootprintsOf(world, a, [d.id]);
        const [q] = p.liste;
        // Un lieu qui ne tourne pas (le Marais, le Comptoir, le Manoir, directeur artistique) n'a pas de « Tourner ».
        if (!placeTurns(d.id)) {
          expect(q, d.id).toBeUndefined();
          continue;
        }
        const x = p.cx + q.ox;
        const y = p.cy + q.oy;
        const demi = COTE_DU_RADEAU / 2;
        // À l'échelle 1, le radeau sur l'eau, hors de toute autre emprise.
        expect(autres.some((r) => x + demi > r.x0 && x - demi < r.x1 && y + demi > r.y0 && y - demi < r.y1), d.id).toBe(false);
      }
  });

  it('aucun lieu ne montre de flèche ; « Tourner » sert toujours, sauf aux lieux qui ne tournent pas, qui n’en ont pas', () => {
    for (const id of lieux) {
      const c = chooseIsland(world, id);
      if (!c) continue;
      const p = arrangeView(world, c).poignees!;
      expect(p.liste.every((q) => q.cle === 'tourner' && q.dispo), id).toBe(true);
      expect(p.liste.length, id).toBe(placeTurns(id) ? 1 : 0);
    }
  });

  it('une borne : pas de « Tourner » ; posée sur une terre, une poignée y reste : jamais plus d’une place du bord de l’emprise', () => {
    const id = lieux[0];
    const [st] = questStations(id);
    const c = chooseStation(world, `${id}:${st.typeId}`)!;
    expect(c).not.toBeNull();
    for (const choix of [c, unLieu]) {
      const v = arrangeView(world, choix);
      const p = v.poignees!;
      if (choix === c) expect(p.liste.map((q) => q.cle)).not.toContain('tourner');
      const demi = COTE_DU_RADEAU / 2;
      // Pas plus loin qu'une place du bord de l'emprise (ou que l'écart qui garde deux radeaux voisins séparés).
      const loin = (rayon: number) => Math.max(rayon + 1 + demi, COTE_DU_RADEAU + COTE_DU_RADEAU / 6) + 1e-9;
      const fantome = v.cases.filter((k) => k.genre === 'fantome');
      const r = v.cadre?.rect ?? (fantome.length ? { x0: Math.min(...fantome.map((k) => k.x)), x1: Math.max(...fantome.map((k) => k.x)) + 1, y0: Math.min(...fantome.map((k) => k.y)), y1: Math.max(...fantome.map((k) => k.y)) + 1 } : { x0: 0, x1: 3, y0: 0, y1: 3 });
      for (const q of p.liste) {
        expect(Math.abs(q.ox), `${choix.genre} ${q.cle}`).toBeLessThanOrEqual(loin((r.x1 - r.x0) / 2));
        expect(Math.abs(q.oy), `${choix.genre} ${q.cle}`).toBeLessThanOrEqual(loin((r.y1 - r.y0) / 2));
      }
    }
  });

  it('à toute échelle, deux poignées ne se touchent jamais ni ne touchent le milieu du choix, même autour d’une borne', () => {
    const id = lieux[0];
    const [st] = questStations(id);
    const choix = [chooseStation(world, `${id}:${st.typeId}`)!, unLieu];
    for (const c of choix) {
      const v = arrangeView(world, c);
      const p = v.poignees!;
      const n = p.liste.length;
      const out = new Float32Array(2 * n);
      for (const s of [1, 1.2, 1.5, 2.7, 4, 6, 8, 11]) {
        placerALEchelle(p, s, out);
        const cote = COTE_DU_RADEAU * s;
        for (let i = 0; i < n; i++) {
          // Loin du milieu du choix.
          expect(Math.max(Math.abs(out[2 * i] - p.cx), Math.abs(out[2 * i + 1] - p.cy)), `${c.genre} ${s} ${i}`).toBeGreaterThanOrEqual(cote);
          for (let j = i + 1; j < n; j++) {
            const loin = Math.abs(out[2 * i] - out[2 * j]) >= cote || Math.abs(out[2 * i + 1] - out[2 * j + 1]) >= cote;
            expect(loin, `${c.genre} ${s} ${i}-${j}`).toBe(true);
          }
        }
      }
      expect(p.liste.every((q) => q.places.length === 2 * ECHELLES.length)).toBe(true);
    }
  });
});

describe('la forme des poignées', () => {
  it('cinq poignées tiennent sous 400 triangles, en un appel, dans les deux univers', () => {
    const p = arrangeView(world, unLieu).poignees!;
    for (const style of ['blocs', 'peint'] as const) {
      const c = coutDesPoignees(p, style);
      expect(c.triangles, style).toBeLessThanOrEqual(BUDGET_DES_POIGNEES.triangles);
      expect(c.drawCalls).toBe(1);
    }
    expect(coutDesPoignees(null, 'blocs')).toEqual({ triangles: 0, drawCalls: 0 });
  });

  it('indisponible : la pointe disparaît (moins de triangles), le radeau passe au gris pierre', () => {
    for (const style of ['blocs', 'peint'] as const) {
      const sert = formeDesPoignees([{ cle: 'nord', dispo: true }], style);
      const non = formeDesPoignees([{ cle: 'nord', dispo: false }], style);
      expect(non.index.length).toBeLessThan(sert.index.length);
      const teintes = (f: typeof sert) => new Set(Array.from({ length: f.couleurs.length / 3 }, (_, i) => Array.from(f.couleurs.slice(3 * i, 3 * i + 3)).join(',')));
      expect(teintes(non).has(Float32Array.from(COULEURS_DES_POIGNEES[style].pierre).join(','))).toBe(true);
      expect(teintes(sert).has(Float32Array.from(COULEURS_DES_POIGNEES[style].pierre).join(','))).toBe(false);
    }
  });

  it('jamais le jaune des places libres', () => {
    const jaune = Array.from(Float32Array.from([0xff / 255, 0xc2 / 255, 0x1a / 255]));
    for (const style of ['blocs', 'peint'] as const) {
      const f = formeDesPoignees(CLES_DES_POIGNEES.map((cle) => ({ cle, dispo: true })), style);
      for (let i = 0; i < f.couleurs.length; i += 3) expect([f.couleurs[i], f.couleurs[i + 1], f.couleurs[i + 2]]).not.toEqual(jaune);
    }
  });

  it('chaque flèche regarde son côté : sa pointe (étroite) est du côté de la poignée, sa tige (large) de l’autre', () => {
    for (const cle of ['nord', 'sud', 'est', 'ouest'] as const) {
      const f = formeDesPoignees([{ cle, dispo: true }], 'blocs');
      const s = DIRECTION_STEP[cle];
      // Les sommets de la flèche, au-dessus du radeau : leur avance vers le côté, et leur écart de côté.
      const pts: [number, number][] = [];
      for (let i = 0; i < f.positions.length; i += 3)
        if (f.positions[i + 1] > 0.31) pts.push([f.positions[i] * s.dx + f.positions[i + 2] * s.dy, f.positions[i] * s.dy - f.positions[i + 2] * s.dx]);
      const avant = Math.max(...pts.map((p) => p[0]));
      const arriere = Math.min(...pts.map((p) => p[0]));
      const largeur = (bout: number) => {
        const cote = pts.filter((p) => Math.abs(p[0] - bout) < 1e-6).map((p) => p[1]);
        return Math.max(...cote) - Math.min(...cote);
      };
      expect(largeur(avant), cle).toBeLessThan(largeur(arriere));
    }
  });

  it('« Tourner » d’Archipéo tourne comme celui de Blocland (↷) : la pointe à droite de l’écran, vers le bas', () => {
    const f = formeDesPoignees([{ cle: 'tourner', dispo: true }], 'peint');
    const n = f.positions.length / 3;
    // La pointe : le dernier triangle (sa base, puis son bout). À l'écran, la droite est vers les x qui descendent.
    const u = (i: number) => -f.positions[3 * i];
    const v = (i: number) => f.positions[3 * i + 2];
    const baseU = (u(n - 3) + u(n - 2)) / 2;
    const baseV = (v(n - 3) + v(n - 2)) / 2;
    expect(baseU).toBeGreaterThan(0.5);
    expect(v(n - 1)).toBeLessThan(baseV - 0.3);
    // Une pointe bien marquée : sa base au moins deux fois plus large que l'arc n'est épais.
    const base = Math.hypot(u(n - 3) - u(n - 2), v(n - 3) - v(n - 2));
    const arc = Math.hypot(u(n - 4) - u(n - 7), v(n - 4) - v(n - 7));
    expect(base).toBeGreaterThan(2 * arc);
    // Indisponible : l'arc seul, sans pointe.
    expect(formeDesPoignees([{ cle: 'tourner', dispo: false }], 'peint').index.length).toBe(f.index.length - 3);
  });
});

describe('une place prise (choix 3 du mainteneur)', () => {
  it('la croix grise, bordée de sombre, au milieu du choix ; avec cinq poignées, toujours sous 400 triangles, un appel', () => {
    const c = unLieu.genre === 'lieu' ? { ...unLieu, spot: spotOf(world, lieux.find((id) => id !== unLieu.id && chooseIsland(world, id))!) } : unLieu;
    expect(choiceFits(world, c)).toBe(false);
    const p = arrangeView(world, c).poignees!;
    expect(p.prise?.bras).toBeGreaterThanOrEqual(1.2);
    expect(p.liste.every((q) => q.dispo)).toBe(true);
    for (const style of ['blocs', 'peint'] as const) {
      const f = formeDesPoignees(p.liste, style, p.prise);
      // Une pièce de plus que de poignées : la croix, en dernier.
      expect(f.debuts.length).toBe(p.liste.length + 2);
      expect(coutDesPoignees(p, style).triangles, style).toBeLessThanOrEqual(BUDGET_DES_POIGNEES.triangles);
      const sans = formeDesPoignees(p.liste, style);
      expect(f.index.length - sans.index.length).toBe(8 * 3);
      const teintes = new Set(Array.from({ length: f.couleurs.length / 3 }, (_, i) => Array.from(f.couleurs.slice(3 * i, 3 * i + 3)).join(',')).slice(f.debuts.at(-2)));
      expect(teintes.has(Float32Array.from(COULEURS_DES_POIGNEES[style].croix).join(','))).toBe(true);
      expect(teintes.has(Float32Array.from(COULEURS_DES_POIGNEES[style].bord).join(','))).toBe(true);
    }
    // Sur une place libre, pas de croix.
    expect(arrangeView(world, unLieu).poignees!.prise).toBeUndefined();
  });

  it('son bord sombre fait 2 px au moins à l’écran, à toute échelle et pour toute taille de croix', () => {
    // À l'échelle `s`, un radeau de `COTE_DU_RADEAU × s` cases fait `POIGNEE_MIN_PX` de haut (au moins, à l'échelle 1) ;
    // la croix est agrandie de `max(1, s × COTE_DU_RADEAU / (2 × bras))` (three/arrangeHandles.ts).
    for (let bras = 1.2; bras <= 5; bras += 0.1)
      for (let s = 1; s <= 12; s += 0.25) {
        const f = Math.max(1, (s * COTE_DU_RADEAU) / (2 * bras));
        const pxParCase = POIGNEE_MIN_PX / (COTE_DU_RADEAU * s);
        expect(bordDeLaCroix(bras) * f * pxParCase, `bras ${bras.toFixed(1)}, échelle ${s}`).toBeGreaterThanOrEqual(2);
      }
  });
});

describe('une arrivée ou une borne choisie', () => {
  it('aucune poignée : elle se déplace en touchant la côte de son lieu (« trop de boutons », 7 octobre 2026)', () => {
    for (const a of ARCHIPELAGO_IDS)
      for (const [link, t] of routesIn(world, a)) {
        const l = t ? currentLandings(world, link) : null;
        if (!l) continue;
        for (const end of ['from', 'to'] as const) {
          const c: ArrangeChoice = { genre: 'arrivee', link, end, landing: l[end] };
          const p = arrangeView(world, c).poignees!;
          expect(p.liste, `${link} ${end}`).toEqual([]);
        }
      }
  });
});

describe('une poignée hors de la place libre', () => {
  const libre = { x0: 0, y0: 80, x1: 800, y1: 500 };
  it('dedans : rien ; sous la ligne du haut, sous la barre, hors de l’écran : elle sort', () => {
    const une = (x: number, y: number) => Float32Array.from([0, x, y, 48, 48]);
    expect(sortDeLaPlace(une(400, 300), 1, libre)).toBe(false);
    expect(sortDeLaPlace(une(400, 90), 1, libre)).toBe(true);
    expect(sortDeLaPlace(une(400, 490), 1, libre)).toBe(true);
    expect(sortDeLaPlace(une(-30, 300), 1, libre)).toBe(true);
    expect(sortDeLaPlace(Float32Array.from([0, 400, 300, 48, 48, 1, 790, 300, 48, 48]), 2, libre)).toBe(true);
  });

  it('ramenée dans la place, du moins possible (GD-12, relecture UX UI) : zéro dedans, l’écart du bord sinon', () => {
    const une = (x: number, y: number) => Float32Array.from([0, x, y, 48, 48]);
    const e = { x: 0, y: 0 };
    expect(ecartVersLaPlace(une(400, 300), 1, libre, 4, e)).toEqual({ x: 0, y: 0 });
    // Sous la ligne du haut : son haut à 66, ramené à 84 (le haut de la place, et la marge).
    expect(ecartVersLaPlace(une(400, 90), 1, libre, 4, e)).toEqual({ x: 0, y: 18 });
    expect(ecartVersLaPlace(une(790, 490), 1, libre, 4, e)).toEqual({ x: -18, y: -18 });
    // Trop grandes pour la place : alignées sur son haut.
    expect(ecartVersLaPlace(Float32Array.from([0, 400, 60, 48, 48, 1, 400, 520, 48, 48]), 2, libre, 4, e).y).toBe(48);
    expect(ecartVersLaPlace(une(400, 300), 0, libre, 4, e)).toEqual({ x: 0, y: 0 });
  });
});
