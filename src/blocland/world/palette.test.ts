import { AMBIENCE, mixColor, palette } from './daylight';
import { ARCHIPELAGO_IDS, type Ground } from './map';
import {
  ANNEAUX_DU_CIEL,
  LUEUR,
  MATIERES,
  PALETTES,
  ambianceDe,
  eauxDe,
  SOLS,
  cielDe,
  couleurDeMatiere,
  couleurDuCiel,
  couleurDuSol,
  deNuit,
  domeDuCiel,
  luminance,
  multiplie,
  teinteSur,
} from './palette';
import { PAINTERS, type TextureKind } from './pixels';

const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const valid = (c: number) => Number.isInteger(c) && c >= 0 && c <= 0xffffff;

it('le monde en blocs garde son ambiance : la palette d’Archipéo ne touche pas à daylight', () => {
  expect(palette(1, '6e').sky).toBe(0x8fd0f5);
  expect(palette(0, '6e').sky).toBe(AMBIENCE['6e'].skyNight);
});

it('a un ciel, une brume et une lumière pour chaque archipel, de jour et de nuit', () => {
  for (const a of ARCHIPELAGO_IDS) {
    for (const light of [0, 0.5, 1]) {
      const c = cielDe(a, light);
      for (const k of ['zenith', 'horizon', 'lueur', 'soleil', 'ambianceCiel', 'ambianceSol', 'mer'] as const) expect(valid(c[k]), `${a} ${k}`).toBe(true);
      expect(c.brumeProche, a).toBeGreaterThan(0);
      expect(c.brumeProche, a).toBeLessThan(c.brumeLoin);
    }
    expect(cielDe(a, 1).zenith).toBe(PALETTES[a].jour.zenith);
    expect(cielDe(a, 0).zenith).toBe(PALETTES[a].nuit.zenith);
    // Hors bornes : la lumière est ramenée entre 0 et 1.
    expect(cielDe(a, 2)).toEqual(cielDe(a, 1));
    expect(cielDe(a, -1)).toEqual(cielDe(a, 0));
  }
  // Quatre ambiances différentes, et le 3e garde son plancher de nuages.
  expect(new Set(ARCHIPELAGO_IDS.map((a) => cielDe(a, 1).horizon)).size).toBe(4);
  expect(new Set(ARCHIPELAGO_IDS.map((a) => cielDe(a, 1).zenith)).size).toBe(4);
  expect(ARCHIPELAGO_IDS.filter((a) => PALETTES[a].nuages)).toEqual(['3e']);
  for (const a of ARCHIPELAGO_IDS) expect(PALETTES[a].nuages).toBe(AMBIENCE[a].sky);
});

it('la nuit reste un bleu de crépuscule, jamais un noir', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const n = cielDe(a, 0);
    for (const k of ['zenith', 'horizon', 'lueur'] as const) {
      const [r, g, b] = rgb(n[k]);
      expect(Math.min(r, g, b), `${a} ${k}`).toBeGreaterThanOrEqual(0x1c);
      expect(b, `${a} ${k} bleu`).toBeGreaterThan(r);
      expect(luminance(n[k]), `${a} ${k}`).toBeGreaterThan(0.02);
    }
    // L'horizon de nuit est plus clair que son zénith : la ligne d'horizon se lit encore.
    expect(luminance(n.horizon)).toBeGreaterThan(luminance(n.zenith));
    // Le monde reste éclairé : la lune et l'ambiance ne s'éteignent pas.
    expect(n.soleilForce).toBeGreaterThan(0.5);
    expect(n.ambianceForce).toBeGreaterThan(0.5);
  }
});

it('le soleil est chaud, l’ambiance froide ; la nuit, la lune est froide', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const [sr, , sb] = rgb(cielDe(a, 1).soleil);
    expect(sr, a).toBeGreaterThan(sb);
    const [ar, , ab] = rgb(cielDe(a, 1).ambianceCiel);
    expect(ab, a).toBeGreaterThan(ar);
    const [mr, , mb] = rgb(cielDe(a, 0).soleil);
    expect(mb, a).toBeGreaterThan(mr);
    expect(cielDe(a, 1).soleilForce).toBeGreaterThan(cielDe(a, 0).soleilForce);
  }
});

it('le dôme va de l’horizon au zénith, avec une lueur juste au-dessus de la ligne d’horizon', () => {
  for (const a of ARCHIPELAGO_IDS)
    for (const light of [0, 1]) {
      const c = cielDe(a, light);
      // La brume prend la couleur de l'horizon : sous la ligne et à la ligne, le dôme est la brume.
      expect(couleurDuCiel(c, -0.5)).toBe(c.horizon);
      expect(couleurDuCiel(c, 0)).toBe(c.horizon);
      expect(couleurDuCiel(c, 1)).toBe(c.zenith);
      expect(luminance(couleurDuCiel(c, LUEUR / 2)), `${a} lueur`).toBeGreaterThan(luminance(c.horizon));
      // Au-dessus de la lueur, un dégradé qui ne revient jamais en arrière vers l'horizon.
      let last = luminance(couleurDuCiel(c, LUEUR));
      for (let e = LUEUR + 0.05; e <= 1; e += 0.05) {
        const l = luminance(couleurDuCiel(c, e));
        expect(l, `${a} ${light} ${e}`).toBeLessThanOrEqual(last + 1e-3);
        last = l;
      }
    }
});

it('le dôme est un seul maillage, vu de l’intérieur, léger', () => {
  const c = cielDe('6e', 1);
  const d = domeDuCiel(c, 24);
  const verts = d.positions.length / 3;
  expect(d.colors.length).toBe(d.positions.length);
  expect(verts).toBe(ANNEAUX_DU_CIEL.length * 25);
  expect(d.indices.length / 3).toBeLessThanOrEqual(600);
  for (const i of d.indices) expect(i).toBeLessThan(verts);
  for (let v = 0; v < verts; v++) expect(Math.hypot(d.positions[v * 3], d.positions[v * 3 + 1], d.positions[v * 3 + 2])).toBeCloseTo(1, 5);
  // Chaque triangle (non dégénéré) tourne sa face vers le centre : on le voit de l'intérieur.
  for (let t = 0; t < d.indices.length; t += 3) {
    const [a, b, e] = [0, 1, 2].map((k) => d.indices[t + k] * 3);
    const p = (i: number) => [d.positions[i], d.positions[i + 1], d.positions[i + 2]];
    const [pa, pb, pe] = [p(a), p(b), p(e)];
    const u = pb.map((v, k) => v - pa[k]);
    const w = pe.map((v, k) => v - pa[k]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (Math.hypot(...n) < 1e-9) continue;
    const mid = [0, 1, 2].map((k) => (pa[k] + pb[k] + pe[k]) / 3);
    expect(n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2]).toBeLessThan(0);
  }
  // Le haut du dôme est le zénith, le bas l'horizon.
  const top = d.colors.slice(-3).map((v) => Math.round(v * 255));
  expect(top).toEqual(rgb(c.zenith));
  expect(d.colors.slice(0, 3).map((v) => Math.round(v * 255))).toEqual(rgb(c.horizon));
});

it('a une couleur de dessus et de côté pour chaque sol et chaque matière, dans chaque archipel', () => {
  const grounds = Object.keys(SOLS) as Ground[];
  const kinds = Object.keys(PAINTERS) as TextureKind[];
  expect(Object.keys(MATIERES).sort()).toEqual([...kinds].sort());
  for (const a of ARCHIPELAGO_IDS)
    for (const light of [0, 1]) {
      for (const g of grounds) {
        const f = couleurDuSol(a, g, light);
        expect(valid(f.dessus) && valid(f.cote), `${a} ${g}`).toBe(true);
      }
      for (const k of kinds) {
        const f = couleurDeMatiere(a, k, light);
        expect(valid(f.dessus) && valid(f.cote), `${a} ${k}`).toBe(true);
      }
    }
  // Chaque archipel a son voile : la même herbe n'a pas la même couleur partout.
  expect(new Set(ARCHIPELAGO_IDS.map((a) => couleurDuSol(a, 'herbe').dessus)).size).toBe(4);
  // L'herbe du sol et le bloc d'herbe sont la même couleur.
  for (const a of ARCHIPELAGO_IDS) expect(couleurDeMatiere(a, 'herbe')).toEqual(couleurDuSol(a, 'herbe'));
  // L'herbe retouchée au lot R3 (moins citron, vers le vert de la planche), ses côtés de terre inchangés.
  expect(SOLS.herbe).toEqual({ dessus: 0x76a860, cote: 0x8a6b4a });
});

it('la nuit, les surfaces bleuissent sans jamais devenir noires ; les lanternes gardent leur éclat', () => {
  for (const a of ARCHIPELAGO_IDS) {
    for (const k of Object.keys(MATIERES) as TextureKind[]) {
      const jour = couleurDeMatiere(a, k, 1);
      const nuit = couleurDeMatiere(a, k, 0);
      for (const c of [nuit.dessus, nuit.cote]) {
        const [r, g, b] = rgb(c);
        expect(Math.max(r, g, b), `${a} ${k}`).toBeGreaterThanOrEqual(0x20);
      }
      if (k === 'lanterne' || k === 'lave') expect(nuit).toEqual(jour);
      else expect(luminance(nuit.dessus), `${a} ${k}`).toBeLessThan(luminance(jour.dessus) + 1e-6);
    }
    const [r, , b] = rgb(couleurDuSol(a, 'herbe', 0).dessus);
    expect(b, a).toBeGreaterThan(r);
  }
});

it('une seule nuit pour la 3D et la 2D : la formule d’avant, de la nuit au plein jour, sans rien changer', () => {
  // La formule que la 2D peinte recopiait (pixel/painted.ts, jusqu'au lot R4), et celle des surfaces de la palette.
  const avant2D = (a: (typeof ARCHIPELAGO_IDS)[number], c: number, light: number) => {
    const n = PALETTES[a].nuit;
    return mixColor(mixColor(multiplie(c, n.ambianceCiel), n.horizon, 0.3), c, Math.min(1, Math.max(0, light)));
  };
  const avant3D = (a: (typeof ARCHIPELAGO_IDS)[number], c: number) => mixColor(multiplie(c, PALETTES[a].nuit.ambianceCiel), PALETTES[a].nuit.horizon, 0.3);
  for (const a of ARCHIPELAGO_IDS)
    for (let c = 0; c <= 0xffffff; c += 0x0b1d27) {
      expect(deNuit(a, c)).toBe(avant3D(a, c));
      for (const light of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) expect(deNuit(a, c, light)).toBe(avant2D(a, c, light));
    }
  // Et la palette lit la même : une surface à mi-jour est le mélange de sa nuit et de son jour.
  for (const a of ARCHIPELAGO_IDS) {
    const jour = couleurDuSol(a, 'herbe', 1).dessus;
    expect(couleurDuSol(a, 'herbe', 0.5).dessus).toBe(mixColor(deNuit(a, jour), jour, 0.5));
  }
});

it('mélange et luminance', () => {
  expect(multiplie(0xffffff, 0x336699)).toBe(0x336699);
  expect(multiplie(0x000000, 0x336699)).toBe(0);
  expect(luminance(0xffffff)).toBeCloseTo(1, 5);
  expect(luminance(0x000000)).toBe(0);
  // La teinte posée sur une texture redonne la couleur visée.
  const moyenne = 0x54a2e4;
  for (const a of ARCHIPELAGO_IDS) {
    const mer = cielDe(a, 1).mer;
    if (PALETTES[a].nuages) continue;
    const got = rgb(multiplie(teinteSur(mer, moyenne), moyenne));
    rgb(mer).forEach((v, i) => expect(Math.abs(got[i] - v), a).toBeLessThanOrEqual(2));
  }
});

it('l’ambiance de chaque archipel reste dans les bornes de la fiche de famille (cadrage Archipéo §6)', () => {
  // Ce qu'un sous-lot R4b peut régler : la force du soleil et de l'ambiance de jour, la brume de profondeur, le voile.
  // La nuit, la direction du soleil et les matières sont communes et ne passent pas par l'ambiance.
  for (const a of ARCHIPELAGO_IDS) {
    const p = ambianceDe(a);
    expect(p, a).toBe(PALETTES[a]);
    expect(p.jour.soleilForce, a).toBeGreaterThanOrEqual(2.0);
    expect(p.jour.soleilForce, a).toBeLessThanOrEqual(2.4);
    expect(p.jour.ambianceForce, a).toBeGreaterThanOrEqual(0.95);
    expect(p.jour.ambianceForce, a).toBeLessThanOrEqual(1.2);
    expect(p.brume[0], a).toBeGreaterThanOrEqual(60);
    expect(p.brume[0], a).toBeLessThanOrEqual(120);
    expect(p.brume[1], a).toBeGreaterThanOrEqual(250);
    expect(p.brume[1], a).toBeLessThanOrEqual(360);
    expect(p.voile[1], a).toBeLessThanOrEqual(0.12);
    expect(eauxDe(a).mer, a).toBe(p.teinteDeMer);
  }
});
