// Les poignées du mode « Modifier le plan » dans le monde (GD-9, intention du directeur artistique du 6 octobre 2026) :
// chacune de son côté, sur l'eau, à une place du bord de l'emprise du choix ; « Tourner » au coin nord-est et seulement
// pour ce qui tourne ; indisponible quand la flèche ne trouve plus de place ; sans se toucher à aucune échelle ; et
// leur forme sous le budget (400 triangles, un appel), sans le jaune des places libres.
import { describe, expect, it } from 'vitest';
import { DIRECTION_STEP } from './arrange';
import {
  BUDGET_DES_POIGNEES,
  ECHELLES,
  CLES_DES_POIGNEES,
  COTE_DU_RADEAU,
  COULEURS_DES_POIGNEES,
  coutDesPoignees,
  formeDesPoignees,
  placerALEchelle,
} from './arrangeHandles';
import { chooseGuardian, chooseIsland, chooseStation, stepChoice } from './arrangeMode';
import { arrangeView } from './arrangeView';
import { toutConstruit } from './budget';
import { mapOf } from './map';
import { questStations } from './terrain/markers';

const { world } = toutConstruit();
const lieux = mapOf('6e').map((d) => d.id);
const unLieu = lieux.map((id) => chooseIsland(world, id)).find((c) => c !== null)!;

describe('les poignées autour du choix', () => {
  it('un lieu : les quatre flèches de leur côté, « Tourner » au coin nord-est, toutes hors de l’emprise du fantôme', () => {
    const v = arrangeView(world, unLieu);
    const p = v.poignees!;
    expect(p.liste.map((q) => q.cle)).toEqual(CLES_DES_POIGNEES);
    const r = v.cadre!.rect;
    for (const q of p.liste) {
      const x = p.cx + q.ox;
      const y = p.cy + q.oy;
      const demi = COTE_DU_RADEAU / 2;
      // Hors de l'emprise, d'au moins une place.
      const dehors = x + demi <= r.x0 - 1 + 1e-9 || x - demi >= r.x1 + 1 - 1e-9 || y + demi <= r.y0 - 1 + 1e-9 || y - demi >= r.y1 + 1 - 1e-9;
      expect(dehors, q.cle).toBe(true);
      if (q.cle === 'tourner') {
        expect(Math.sign(q.ox)).toBe(DIRECTION_STEP.est.dx);
        expect(Math.sign(q.oy)).toBe(DIRECTION_STEP.nord.dy);
      } else {
        const s = DIRECTION_STEP[q.cle];
        expect(Math.sign(q.ox)).toBe(s.dx);
        expect(Math.sign(q.oy)).toBe(s.dy);
      }
    }
  });

  it('une flèche qui ne trouve plus de place est indisponible ; les autres servent', () => {
    for (const id of lieux) {
      const c = chooseIsland(world, id);
      if (!c) continue;
      const p = arrangeView(world, c).poignees!;
      for (const q of p.liste) if (q.cle !== 'tourner') expect(q.dispo, `${id} ${q.cle}`).toBe(stepChoice(world, c, q.cle) !== null);
    }
  });

  it('une borne : pas de « Tourner » ; posée sur une terre, une poignée glisse jusqu’à l’eau de son côté', () => {
    const id = lieux[0];
    const [st] = questStations(id);
    const c = chooseStation(world, `${id}:${st.typeId}`)!;
    expect(c).not.toBeNull();
    const p = arrangeView(world, c).poignees!;
    expect(p.liste.map((q) => q.cle)).not.toContain('tourner');
    // La borne est sur son île : au moins une poignée a glissé plus loin que sa place de départ (2,5 cases du milieu).
    expect(Math.max(...p.liste.map((q) => Math.abs(q.ox) + Math.abs(q.oy)))).toBeGreaterThan(1.5 + 1 + COTE_DU_RADEAU / 2);
  });

  it('un Gardien tourne : « Tourner » sert toujours', () => {
    const c = chooseGuardian(world, lieux[1])!;
    const p = arrangeView(world, c).poignees!;
    expect(p.liste.find((q) => q.cle === 'tourner')?.dispo).toBe(true);
  });

  it('à toute échelle, deux poignées ne se touchent jamais ni ne touchent le milieu du choix, même autour d’une borne', () => {
    const id = lieux[0];
    const [st] = questStations(id);
    const choix = [chooseStation(world, `${id}:${st.typeId}`)!, unLieu, chooseGuardian(world, lieux[1])!];
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
});
