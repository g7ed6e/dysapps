// Les retouches du rendu du Jardin des heures (LV2, 4e), décidées par le directeur artistique le 28/09 après les
// relectures (consultants Archipéo et Blocland, référent dys) : le cadrage de la voisine, le pont avec « Pas de LV2 », le
// cœur en herbe, Muscade et le Soleil de Blocland, la tonnelle, le poteau-lanterne, l'osier et le ponton.
import { DEFAULT_SETTINGS, retenirReglages, type Lv2Choice } from '../../core/settings';
import { BIOMES, BLOCKS, type BiomeId } from '../biomes';
import { bridgesOf, grantAccess, otherEnd } from './archipelago';
import { buildingStages } from './architect';
import { DEPTH_DU_SOL, GRASS } from './decor';
import { luminance } from './palette';
import { CREATURE_CUBES } from './personnages/creatures';
import { GUARDIAN_CUBES } from './personnages/gardiens';
import { PAINTERS, SIZE } from './pixels';
import { DEPTH, islandCenter, worldCubes, viewZone } from './terrain';
import { CORE, islandDef, landBox } from './map';
import { LUEUR, SENTINELLE } from './personnages/couleurs';
import { allumage, sentinelleEnFacettes } from './personnages/sentinelle';
import { STATUES } from './personnages/sentinellesPeintes';
import { SOLEIL_DE_CUIVRE } from './personnages/statues/4e';

const LV2 = BIOMES.filter((b) => b.subject === 'lv2').map((b) => b.id);

function avecLv2<T>(lv2: Lv2Choice, f: () => T): T {
  try {
    retenirReglages({ ...DEFAULT_SETTINGS, lv2 });
    return f();
  } finally {
    retenirReglages(null);
  }
}

it('les îles de la LV2 : le Relais au 5e, le Jardin des heures au 4e, le Refuge des carnets au 3e', () => {
  expect(LV2.sort()).toEqual(['jardin', 'refuge', 'relais']);
});

it('l’île de la LV2 n’élargit jamais le cadrage de sa voisine (cadrage d’avant) ; depuis elle, la voisine compte', () => {
  for (const lv2 of LV2) {
    const box = landBox(islandDef(lv2));
    for (const b of bridgesOf(lv2)) {
      const voisine = otherEnd(b, lv2);
      const z = viewZone(voisine);
      // Sans l'île de la LV2 : la zone de la voisine et de ses autres voisines seulement.
      const ids = [voisine, ...bridgesOf(voisine).map((x) => otherEnd(x, voisine)).filter((id) => id !== lv2)];
      const boxes = ids.map((id) => landBox(islandDef(id)));
      expect(z).toEqual({
        minX: Math.min(...boxes.map((x) => x.x0)),
        maxX: Math.max(...boxes.map((x) => x.x1)),
        minY: Math.min(...boxes.map((x) => x.y0)),
        maxY: Math.max(...boxes.map((x) => x.y1)),
      });
      const depuis = viewZone(lv2);
      const v = landBox(islandDef(voisine));
      expect(depuis.minX <= v.x0 || depuis.maxX >= v.x1, `${lv2} → ${voisine}`).toBe(true);
      expect(depuis.minX).toBeLessThanOrEqual(box.x0);
      expect(depuis.maxX).toBeGreaterThanOrEqual(box.x1);
    }
  }
});

describe('avec « Pas de LV2 », ni pont ni amorce vers l’île de la LV2', () => {
  const cas: [BiomeId, BiomeId, '5e' | '4e' | '3e'][] = [
    ['comptoir', 'relais', '5e'],
    ['theatre', 'jardin', '4e'],
    ['chateau', 'refuge', '3e'],
  ];
  for (const [voisine, ile, a] of cas) {
    const id = `${voisine}-${ile}`;
    const ouvert = grantAccess([], [voisine]);
    const cubesDu = (lv2: Lv2Choice, ponts: string[]) => avecLv2(lv2, () => worldCubes(a, {}, { plans: {}, journal: [], bridges: ponts }, false));

    it(`${ile} : pas de fantôme du pont sans LV2, un fantôme avec une LV2`, () => {
      expect(ouvert).not.toContain(id);
      expect(cubesDu('aucune', ouvert).filter((c) => c.bridge === id)).toEqual([]);
      const fantome = cubesDu('es', ouvert).filter((c) => c.bridge === id);
      expect(fantome.length).toBeGreaterThan(0);
      expect(fantome.every((c) => c.ghost)).toBe(true);
    });

    it(`${ile} : un pont déjà construit reste (la sauvegarde ne perd rien)`, () => {
      const construit = cubesDu('aucune', [...ouvert, id]).filter((c) => c.bridge === id);
      expect(construit.length).toBeGreaterThan(0);
      expect(construit.some((c) => c.ghost)).toBe(false);
    });
  }
});

it('le cœur du Jardin est en herbe ; l’osier reste aux bordures du potager, au panier et aux bâtiments', () => {
  const c = islandCenter('jardin');
  const def = islandDef('jardin');
  const cubes = worldCubes('4e', {}, { plans: {}, journal: [], bridges: grantAccess([], ['jardin']) }, false);
  const coeur = cubes.filter((q) => q.sol && q.x >= def.core.x && q.x < def.core.x + CORE && q.y >= def.core.y && q.y < def.core.y + CORE);
  const dessus = new Map<string, (typeof coeur)[number]>();
  for (const q of coeur) {
    const k = `${q.x},${q.y}`;
    if (!dessus.has(k) || dessus.get(k)!.z < q.z) dessus.set(k, q);
  }
  expect(dessus.size).toBe(CORE * CORE);
  for (const q of dessus.values()) expect(q.color).toBe(GRASS);
  // L'osier du décor : les bordures du potager et le panier.
  const osier = cubes.filter((q) => q.tag === 'jardin' && q.texture === 'osier');
  expect(osier.length).toBeGreaterThan(0);
  // Jamais le sol : le décor (bordures, panier), les plans et les lieux de l'île (bâtis dans son bloc).
  expect(osier.some((q) => q.sol)).toBe(false);
  expect(osier.some((q) => !q.ghost)).toBe(true);
  expect(c.x).toBeGreaterThan(0);
});

describe('Blocland : Muscade et le Soleil de cuivre', () => {
  it('Muscade : le museau clair entre les yeux (le nez au ton du museau), le bout de la queue plus clair', () => {
    const m = CREATURE_CUBES.jardin;
    const face = m.filter((q) => q.y === 0 && q.z === 4).sort((p, q) => p.x - q.x);
    expect(face.map((q) => q.color)).toEqual(['#1f1a16', '#c89a72', '#1f1a16']);
    const queue = m.filter((q) => q.y >= 3);
    const haut = Math.max(...queue.map((q) => q.z));
    const bout = queue.filter((q) => q.z === haut);
    const reste = queue.filter((q) => q.z < haut - 1);
    for (const q of bout) for (const r of reste) expect(luminance(parseInt(q.color.slice(1), 16))).toBeGreaterThan(luminance(parseInt(r.color.slice(1), 16)));
  });

  it('le Soleil : sans pied ni jambes, posé sur une dalle pleine d’un cube ; les rayons du bas en biais ne touchent pas le sol', () => {
    const s = GUARDIAN_CUBES.jardin;
    const sol = s.filter((q) => q.z === 0);
    const xs = [...new Set(sol.map((q) => q.x))].sort((p, q) => p - q);
    const ys = [...new Set(sol.map((q) => q.y))].sort((p, q) => p - q);
    // Un rectangle plein, plus large que le rayon du bas (pas un pied de 3 × 3), sans trou.
    expect(sol).toHaveLength(xs.length * ys.length);
    expect(xs[xs.length - 1] - xs[0] + 1).toBe(xs.length);
    expect(xs.length).toBeGreaterThan(3);
    // Au-dessus de la dalle, rien ne descend au sol : les rayons en biais du bas pendent, un cube plus haut.
    const pris = new Set(s.map((q) => `${q.x},${q.y},${q.z}`));
    const biais = s.filter((q) => q.z === 1 && (q.x < xs[0] || q.x > xs[xs.length - 1]));
    expect(biais.length).toBe(2);
    for (const q of biais) expect(pris.has(`${q.x},${q.y},0`)).toBe(false);
  });
});

it('la tonnelle : le portique fermé à angles droits (le linteau en (4, 3, 2) et (5, 3, 2)), la table en planches', () => {
  const [, tonnelle] = buildingStages('jardin', 'osier');
  const en = (x: number, y: number, z: number) => tonnelle.find((c) => c.x === x && c.y === y && c.z === z)?.block;
  expect(en(4, 3, 2)).toBe('osier');
  expect(en(5, 3, 2)).toBe('osier');
  expect(en(4, 3, 0)).toBe('bois');
  expect(en(5, 3, 0)).toBe('bois');
  expect(tonnelle.some((c) => c.x >= 4 && c.block === 'barriere')).toBe(false);
});

it('le poteau-lanterne du potager est éteint : aucune lanterne dans le décor du Jardin', () => {
  const cubes = worldCubes('4e', {}, { plans: {}, journal: [], bridges: grantAccess([], ['jardin']) }, false);
  const decor = cubes.filter((q) => q.tag === 'jardin' && q.decor);
  expect(decor.some((q) => q.texture === 'lanterne')).toBe(false);
  expect(decor.some((q) => q.color === BLOCKS.lanterne.side)).toBe(false);
});

describe('l’osier en 3D, calé sur la vue peinte, et lisible en gris', () => {
  const lum = (rgb: number[]) => luminance((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
  const pixels = (face: 'top' | 'side') => {
    const r = () => 0.5;
    return Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => lum(PAINTERS.osier[face](x, y, r))));
  };
  const contraste = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  for (const face of ['top', 'side'] as const) {
    it(`${face === 'top' ? 'dessus' : 'côté'} : des rangs de quatre, la dernière ligne en joint, un joint environ deux fois plus sombre que le brin`, () => {
      const p = pixels(face);
      const joint = p[SIZE - 1][0];
      // La dernière ligne est un joint, d'un bout à l'autre (pas de bande claire à la jointure de deux blocs).
      expect(p[SIZE - 1].every((v) => v === joint)).toBe(true);
      expect(p[SIZE - 2].every((v) => v === joint)).toBe(true);
      // Les rangs de quatre : deux lignes de brin, deux de joint (sous le bord du panier, sur le côté).
      for (let y = face === 'side' ? 4 : 0; y < SIZE; y++) {
        const estJoint = y % 4 >= 2;
        expect(p[y].every((v) => v === joint), `ligne ${y}`).toBe(estJoint);
      }
      // Le brin, hors des montants, contre le joint : 2:1 à peu près, ni moins (il se lit en gris), ni beaucoup plus (le moiré).
      const brin = p[5][1];
      expect(contraste(brin, joint)).toBeGreaterThan(1.8);
      expect(contraste(brin, joint)).toBeLessThan(2.3);
    });
  }

  it('les montants tous les huit pixels, décalés de quatre d’un rang à l’autre (le motif `tresse` de la 2D)', () => {
    const p = pixels('top');
    const brin = p[0][0];
    const montants = (y: number) => p[y].map((v, x) => (v < brin ? x : -1)).filter((x) => x >= 0);
    expect(montants(0)).toEqual([6, 7, 14, 15]);
    expect(montants(4)).toEqual([2, 3, 10, 11]);
  });

  it('en gris, l’osier ne se confond ni avec les planches ni avec la dalle : son motif le distingue', () => {
    // Même d'une luminance voisine, la tresse a ses rangs de quatre et ses joints : les planches ont des lames, la dalle
    // des joints d'un pixel. On vérifie au moins que ses joints sont plus sombres que le fond des deux autres.
    const moyenne = (kind: 'planches' | 'dalle') => {
      let s = 1;
      const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      let t = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) t += lum(PAINTERS[kind].side(x, y, r));
      return t / (SIZE * SIZE);
    };
    const joint = pixels('side')[SIZE - 1][0];
    expect(joint).toBeLessThan(moyenne('planches'));
    expect(joint).toBeLessThan(moyenne('dalle'));
  });
});

it('le ponton : l’échelle s’appuie sur la falaise, un pilier de pierre sous le rivage jusqu’à l’eau', () => {
  expect(DEPTH_DU_SOL).toBe(DEPTH);
  const cubes = worldCubes('4e', {}, { plans: {}, journal: [], bridges: grantAccess([], ['jardin']) }, false);
  const ponton = cubes.filter((q) => q.decor?.startsWith('jardin/ponton@'));
  const echelle = ponton.filter((q) => q.texture === 'escalier');
  expect(echelle.length).toBeGreaterThan(0);
  const pris = new Set(cubes.map((q) => `${q.x},${q.y},${q.z}`));
  // Chaque barreau a, contre lui côté île (−x), de la roche ou de la terre.
  for (const q of echelle) expect(pris.has(`${q.x - 1},${q.y},${q.z}`), `z ${q.z}`).toBe(true);
});

describe('le Soleil de cuivre d’Archipéo, jamais un rouage, lisible en gris', () => {
  const S = SOLEIL_DE_CUIVRE;
  // La statue droite (sans son tour), pour la lire dans son plan.
  const f = sentinelleEnFacettes({ ...STATUES.jardin, tour: undefined });
  const sculpture = f.table.findIndex((p) => p.nom === 'sculpture');
  const veines = f.table.findIndex((p) => p.nom === 'veines');
  const centre = S.berceau + S.bout - S.enfonce;
  const sommetsDe = (piece: number) => {
    const out: [number, number][] = [];
    for (let t = 0; t < f.pieces.length; t++) if (f.pieces[t] === piece) for (let k = 0; k < 3; k++) out.push([f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1] - centre]);
    return out;
  };

  it('huit rayons égaux et pointus (la pointe ~0), un disque de 16 à 20 pans plus petit que les rayons ne sont longs, pas d’alternance', () => {
    expect(S.rayons).toBe(8);
    expect(S.pans).toBeGreaterThanOrEqual(16);
    expect(S.pans).toBeLessThanOrEqual(20);
    expect(S.rayon).toBeCloseTo(1.15, 2);
    expect(S.bout).toBeCloseTo(2.4, 2);
    const pts = sommetsDe(sculpture);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 2 + (k * Math.PI) / 4;
      const [dx, dy] = [Math.cos(a), Math.sin(a)];
      // Les sommets au-delà du disque, dans la direction du rayon : le plus loin est à la pointe, sur l'axe.
      const loin = pts.filter(([x, y]) => x * dx + y * dy > S.rayon + 0.05 && Math.abs(-x * dy + y * dx) < 0.4);
      const bout = Math.max(...loin.map(([x, y]) => x * dx + y * dy));
      expect(bout, `rayon ${k}`).toBeCloseTo(S.bout, 2);
      for (const [x, y] of loin.filter(([x, y]) => x * dx + y * dy > S.bout - 0.01)) expect(Math.abs(-x * dy + y * dx)).toBeLessThan(0.02);
    }
  });

  it('pas d’anneau de lueur au bord du disque : les fils partent du cœur, suivent les rayons, et restent dedans', () => {
    for (const [x, y] of sommetsDe(veines)) {
      const r = Math.hypot(x, y);
      if (r < 0.2) continue;
      const a = Math.atan2(y, x) - Math.PI / 2;
      const k = Math.round(a / (Math.PI / 4));
      // Chaque sommet de fil est sur l'axe d'un rayon, à moins de la demi-largeur du fil.
      expect(Math.abs(a - k * (Math.PI / 4)) * r).toBeLessThan(0.08);
      expect(r).toBeLessThan(S.bout);
    }
  });

  it('en gris, les fils se lisent contre la pierre, éteints comme rallumés (contraste 1,5 au moins)', () => {
    const c = (a: number, b: number) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    expect(c(allumage(LUEUR, 0), allumage(SENTINELLE.pierre, 0))).toBeGreaterThanOrEqual(1.5);
    expect(c(allumage(LUEUR, 1), allumage(SENTINELLE.pierre, 1))).toBeGreaterThanOrEqual(1.5);
  });
});
