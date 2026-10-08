import { toutConstruit } from './budget';
import { mixColor } from './daylight';
import { champDuSol, colonneEn, NIVEAU_EAU, RIVAGE } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import {
  BORD,
  cadreDeLaMer,
  carteDeLaMer,
  compense,
  couleurDeLaMer,
  distanceSurLaCarte,
  ECUME,
  exposition,
  grilleDeLaMer,
  houle,
  houleDe,
  PALIERS,
  PAR_CASE,
  PORTEE,
  signatureDesTerres,
  terresDeLaMer,
  trianglesDeLaGrille,
  vueDeJour,
} from './sea';
import { BLEU_LAGON, BRUME, couleurDuSol, eauxDe, luminance, NUIT_OCEAN, PALETTES, SABLE } from './palette';
import { worldBounds, worldCubes } from './terrain';

const contraste = (a: number, b: number) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const reel = (a: ArchipelagoId) => {
  const { progress, world: village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false);
  const autres = cubes.filter((c) => !c.sol);
  const champ = champDuSol(
    a,
    cubes.filter((c) => c.sol),
    autres,
  );
  return { champ, autres, terres: terresDeLaMer(champ, autres) };
};

describe('les eaux de la palette', () => {
  it('le lagon sur les hauts-fonds, la mer de l’archipel, puis le large vers la Nuit océan', () => {
    const mers = new Set<number>();
    for (const a of ARCHIPELAGO_IDS) {
      const e = eauxDe(a);
      mers.add(e.mer);
      expect(couleurDeLaMer(a, 0)).toBe(e.lagon);
      expect(couleurDeLaMer(a, PALIERS.mer)).toBe(e.mer);
      expect(couleurDeLaMer(a, PALIERS.large + 5)).toBe(e.large);
      if (PALETTES[a].nuages) continue;
      // Les hauts-fonds : le Bleu lagon, à peine teinté ; le large : plus sombre que le lagon et la mer.
      expect(e.lagon).toBe(mixColor(BLEU_LAGON, e.mer, 0.2));
      expect(luminance(e.large)).toBeLessThan(luminance(e.mer));
      expect(luminance(e.large)).toBeLessThan(luminance(e.lagon));
      expect(luminance(e.large)).toBeGreaterThan(luminance(NUIT_OCEAN));
      expect(e.ecume).toBe(BRUME);
    }
    // Chaque archipel garde sa teinte de mer.
    expect(mers.size).toBe(4);
  });

  it('le sable se détache du lagon, et l’écume du lagon, tels qu’on les voit de jour', () => {
    for (const a of ARCHIPELAGO_IDS) {
      if (PALETTES[a].nuages) continue;
      const e = exposition(a);
      const sable = vueDeJour(couleurDuSol(a, 'sable').dessus, e);
      const lagon = eauxDe(a).lagon;
      // Comme sur la planche (Sable et Bleu lagon : 2,2 pour 1) ; le liseré d'écume, entre les deux, marque le bord.
      expect(contraste(sable, lagon), a).toBeGreaterThanOrEqual(2);
      expect(contraste(SABLE, BLEU_LAGON)).toBeLessThan(2.3);
      expect(contraste(eauxDe(a).ecume, lagon), a).toBeGreaterThanOrEqual(3);
      // La mer est compensée : de jour, on la voit de la couleur de la palette.
      const vue = vueDeJour(compense(lagon, e), e);
      for (const k of [16, 8, 0]) expect(Math.abs(((vue >> k) & 255) - ((lagon >> k) & 255)), a).toBeLessThanOrEqual(2);
    }
  });
});

describe('la carte de la mer', () => {
  it('les terres : les colonnes qui plongent sous l’eau et les écueils ; aux Îles du Ciel, l’emprise des îles', () => {
    const { champ, terres } = reel('6e');
    expect(terres.some((t) => t.ecueil)).toBe(true);
    const pieds = new Set(champ.pieds.map((p) => `${p.x},${p.y}`));
    for (const t of terres.filter((u) => !u.ecueil)) {
      const col = colonneEn(champ, t.x, t.y);
      expect(col ? col.bas < NIVEAU_EAU : pieds.has(`${t.x},${t.y}`)).toBe(true);
    }
    const ciel = reel('3e');
    expect(ciel.terres.length).toBe(ciel.champ.colonnes.length);
    expect(ciel.terres.some((t) => t.ecueil)).toBe(false);
    // La signature ne dépend pas de l'ordre.
    expect(signatureDesTerres([...terres].reverse())).toBe(signatureDesTerres(terres));
  });

  it('garde la distance à la terre, exacte près des côtes, et rejoint le large sur le bord du cadre', () => {
    const a = '6e';
    const { terres } = reel(a);
    const b = worldBounds(a);
    const carte = carteDeLaMer(a, terres, b);
    const cadre = cadreDeLaMer(b);
    expect(carte.l).toBe(cadre.largeur * PAR_CASE);
    expect(carte.h).toBe(cadre.hauteur * PAR_CASE);
    const terre = new Set(terres.map((t) => `${t.x},${t.y}`));
    // Sur une terre : 0 ; à côté d'une côte droite, la distance au bord de la case, au quart de case près.
    let vus = 0;
    for (const t of terres) {
      if (t.ecueil) continue;
      expect(distanceSurLaCarte(carte, t.x + 0.25, t.y + 0.25)).toBe(0);
      // Une côte vers l'est : la case à l'est est dans l'eau, ainsi que ses voisines.
      if (terre.has(`${t.x + 1},${t.y}`) || terre.has(`${t.x + 1},${t.y - 1}`) || terre.has(`${t.x + 1},${t.y + 1}`) || terre.has(`${t.x + 2},${t.y}`)) continue;
      const d = distanceSurLaCarte(carte, t.x + 1.25, t.y + 0.75);
      expect(Math.abs(d - 0.25), `${t.x},${t.y}`).toBeLessThanOrEqual(0.1);
      vus++;
    }
    expect(vus).toBeGreaterThan(20);
    // Le bord du cadre : le large, sans écume ni lagon qui s'étireraient au-delà de la carte.
    const large = compense(eauxDe(a).large, exposition(a));
    for (const [i, j] of [
      [0, 0],
      [carte.l - 1, 0],
      [0, carte.h - 1],
      [carte.l - 1, carte.h - 1],
      [Math.floor(carte.l / 2), 0],
      [0, Math.floor(carte.h / 2)],
    ]) {
      const o = (j * carte.l + i) * 4;
      expect(carte.data[o + 3]).toBe(255);
      expect((carte.data[o] << 16) | (carte.data[o + 1] << 8) | carte.data[o + 2]).toBe(large);
    }
    expect(BORD).toBeLessThan(24);
  });

  it('les écueils font de l’écume, pas de lagon ; le large reste profond entre les îles éloignées', () => {
    const a = '6e';
    const { terres } = reel(a);
    const b = worldBounds(a);
    const carte = carteDeLaMer(a, terres, b);
    const iles = new Set(terres.filter((t) => !t.ecueil).map((t) => `${t.x},${t.y}`));
    const toutes = new Set(terres.map((t) => `${t.x},${t.y}`));
    const cadre = cadreDeLaMer(b);
    // Un écueil loin des îles (à plus de 12 cases) et du bord du cadre, l'eau libre à l'est : la distance à la terre est
    // courte, mais la couleur reste celle du large.
    const loin = terres.find((t) => {
      if (!t.ecueil || toutes.has(`${t.x + 1},${t.y}`) || toutes.has(`${t.x + 1},${t.y - 1}`) || toutes.has(`${t.x + 1},${t.y + 1}`)) return false;
      if (t.x < cadre.x0 + BORD + 2 || t.y < cadre.y0 + BORD + 2 || t.x > cadre.x0 + cadre.largeur - BORD - 2 || t.y > cadre.y0 + cadre.hauteur - BORD - 2) return false;
      for (let dx = -12; dx <= 12; dx++) for (let dy = -12; dy <= 12; dy++) if (iles.has(`${t.x + dx},${t.y + dy}`)) return false;
      return true;
    });
    expect(loin).toBeDefined();
    const x = loin!.x + 1.25;
    const y = loin!.y + 0.5;
    expect(distanceSurLaCarte(carte, x, y)).toBeLessThan(ECUME.largeur + 0.2);
    const i = Math.floor((x - carte.x0) * PAR_CASE);
    const j = Math.floor((y - carte.y0) * PAR_CASE);
    const o = (j * carte.l + i) * 4;
    const c = (carte.data[o] << 16) | (carte.data[o + 1] << 8) | carte.data[o + 2];
    const lagon = compense(eauxDe(a).lagon, exposition(a));
    const mer = compense(eauxDe(a).mer, exposition(a));
    // Plus sombre que la mer de l'archipel : ce n'est pas un haut-fond.
    expect(luminance(c)).toBeLessThan(luminance(mer));
    expect(luminance(c)).toBeLessThan(luminance(lagon));
    expect(PORTEE).toBe(8);
  });
});

describe('la seconde ligne d’écume', () => {
  it('fixe, à 40 % du liseré, seulement là où l’eau fait au moins 1,5 case entre deux terres', () => {
    expect(ECUME.force).toBe(0.4);
    expect(ECUME.passe).toBe(1.5);
    expect(ECUME.ligne).toBe(0.42);
    // Deux îles de terre (x ≤ 0 et x ≥ 2) séparées d'un passage d'une case, et la mer libre au sud.
    const terres = [];
    for (let y = 0; y < 20; y++) for (const x of [-4, -3, -2, -1, 0, 2, 3, 4, 5, 6]) terres.push({ x, y });
    const carte = carteDeLaMer('6e', terres, { minX: -4, maxX: 7, minY: 0, maxY: 20 });
    const a = (x: number, y: number) => carte.seconde[Math.floor((y - carte.y0) * PAR_CASE) * carte.l + Math.floor((x - carte.x0) * PAR_CASE)];
    // Dans le passage (une case d'eau) : le liseré seul.
    for (let y = 2; y < 18; y++) expect(a(1.5, y + 0.5), `y = ${y}`).toBe(0);
    // En mer libre, au large de la côte ouest : la seconde ligne a sa place.
    for (let y = 2; y < 18; y++) expect(a(-4.7, y + 0.5), `y = ${y}`).toBe(255);
  });
});

describe('la houle et la grille', () => {
  it('la houle reste sous le rivage et se calme près des côtes ; plus ample et lente sur le plancher de nuages', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const h = houleDe(a);
      let max = 0;
      let pres = 0;
      for (let t = 0; t < 30; t += 0.7)
        for (let x = -40; x < 40; x += 3.1)
          for (let z = -40; z < 40; z += 2.9) {
            max = Math.max(max, Math.abs(houle(h, x, z, t, 10)));
            pres = Math.max(pres, Math.abs(houle(h, x, z, t, 0.2)));
          }
      expect(max).toBeLessThanOrEqual(h.large + 1e-9);
      expect(pres).toBeLessThanOrEqual(h.rivage + 1e-9);
      if (PALETTES[a].nuages) {
        expect(h.large).toBeGreaterThan(houleDe('6e').large);
        expect(h.vitesse).toBeLessThan(houleDe('6e').vitesse);
      } else {
        // La mer la plus haute ne recouvre jamais le bord des plages.
        expect(NIVEAU_EAU + h.large).toBeLessThan(RIVAGE);
        expect(h.rivage).toBeLessThan(h.large / 3);
      }
    }
  });

  it('une grille de grands triangles tournés vers le ciel, jusqu’à l’horizon, en quelques milliers de triangles', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const b = worldBounds(a);
      const loin = Math.max(b.maxX - b.minX, b.maxY - b.minY) * 4;
      const g = grilleDeLaMer(b, loin);
      // 6 200 aux Premiers Rivages depuis que la mer couvre tout le cadre de la région (GD-9) ; les îles de sciences (SC-2)
      // tiennent dans le même cadre.
      expect(trianglesDeLaGrille(g), a).toBeLessThanOrEqual(6300);
      let minX = Infinity;
      let maxX = -Infinity;
      for (let t = 0; t < g.indices.length; t += 3) {
        const p = (k: number) => [g.positions[g.indices[t + k] * 3], g.positions[g.indices[t + k] * 3 + 2]];
        const [pa, pb, pc] = [p(0), p(1), p(2)];
        // (b − a) × (c − a), composante verticale : positive, la face regarde le ciel.
        const ny = (pb[1] - pa[1]) * (pc[0] - pa[0]) - (pb[0] - pa[0]) * (pc[1] - pa[1]);
        expect(ny).toBeGreaterThan(0);
        minX = Math.min(minX, pa[0]);
        maxX = Math.max(maxX, pa[0]);
      }
      expect(minX).toBeLessThanOrEqual(b.minX - loin + 1);
      expect(maxX).toBeGreaterThanOrEqual(b.maxX + loin - 1);
    }
  });
});
