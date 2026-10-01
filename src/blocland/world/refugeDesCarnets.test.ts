// Le rendu du Refuge des carnets (LV2, 3e), décidé par le directeur artistique le 29/09 après les relectures
// (consultants Archipéo et Blocland, référent dys) : la place sur la carte, le cœur d'herbe et le lac, le refuge sans
// lanterne, ses trois plans, le bardeau, Timbre et le Papillon de cuivre dans les deux univers.
import { BIOMES, BLOCKS, estIleLv2, type BiomeId } from '../biomes';
import { grantAccess } from './archipelago';
import { buildingStages } from './architect';
import { fenetresDe } from './construction';
import { GRASS } from './decor';
import { CORE, inCore, isLand, islandDef, landBox, landscape, mapOf } from './map';
import { couleurDeMatiere, luminance, MATIERES } from './palette';
import { couleursDuToit } from './toits';
import { CREATURE_CUBES } from './personnages/creatures';
import { GUARDIAN_CUBES } from './personnages/gardiens';
import { SENTINELLE } from './personnages/couleurs';
import { sentinellePeinte, STATUES } from './personnages/sentinellesPeintes';
import { sentinelleEnFacettes } from './personnages/sentinelle';
import { ANGLE_DU_PAPILLON, PAPILLON_DE_CUIVRE } from './personnages/statues/3e';
import { PAINTERS, SIZE } from './pixels';
import { JOINT, nuanceDuMotif } from '../pixel/painted';
import { planCells, plansFor } from './plans';
import { HAUT_DES_NUAGES, NUAGES, nuagesDe, placeDesNuages } from './faune';
import { bossIsletOrigin, HORS_DE_LA_COLONNE, ISLET_H, ISLET_W, viewYaw, worldBounds, worldCubes } from './terrain';

const ouvert = { plans: {}, journal: [], bridges: grantAccess([], ['refuge']) };

describe('la place du Refuge sur la carte du 3e', () => {
  it('à l’est du Château, un cran derrière, sans toucher sa terre', () => {
    const [r, c] = [landBox(islandDef('refuge')), landBox(islandDef('chateau'))];
    expect(r.x0).toBeGreaterThan(c.x1);
    expect(islandDef('refuge').core.y).toBeGreaterThan(islandDef('chateau').core.y);
    expect(islandDef('refuge').altitude).toBe(9);
  });
});

describe('le cœur d’herbe et le lac d’altitude', () => {
  const def = islandDef('refuge');
  const cubes = worldCubes('3e', {}, ouvert, false);

  it('le cœur est en herbe ; le bardeau n’est jamais le sol', () => {
    const dessus = new Map<string, (typeof cubes)[number]>();
    for (const q of cubes.filter((q) => q.sol && inCore(def, q.x, q.y))) {
      const k = `${q.x},${q.y}`;
      const avant = dessus.get(k);
      if (!avant || avant.z < q.z) dessus.set(k, q);
    }
    expect(dessus.size).toBe(CORE * CORE);
    for (const q of dessus.values()) expect(q.color).toBe(GRASS);
    expect(cubes.some((q) => q.tag === 'refuge' && q.sol && q.texture === 'bardeau')).toBe(false);
  });

  it('un seul lac, posé sur l’herbe (au niveau du sol, pas un trou), loin du bord, bordé de pierre plate (sans ponton)', () => {
    const cells = landscape(def);
    const lac = cells.filter((c) => c.ground === 'eau');
    expect(lac.length).toBe(8);
    for (const c of lac) {
      expect(inCore(def, c.x, c.y)).toBe(false);
      expect(c.h, `${c.x},${c.y}`).toBe(0);
      // Loin du bord : quatre cases de terre au moins dans chaque direction (sa bordure, sa rive, et l'herbe au-delà).
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        for (const k of [1, 2, 3, 4]) expect(isLand(def, c.x + dx * k, c.y + dy * k), `${c.x},${c.y}`).toBe(true);
      // Chaque case d'eau touche de l'eau ou la bordure de pierre, jamais l'herbe.
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const v = cells.find((x) => x.x === c.x + dx && x.y === c.y + dy);
        expect(v, `voisine de ${c.x},${c.y}`).toBeDefined();
        expect(['eau', 'roche']).toContain(v?.ground);
      }
    }
    // La bordure, au ras du sol, et de l'herbe autour.
    const bord = cells.filter((c) => c.ground === 'roche');
    expect(bord.length).toBeGreaterThan(0);
    for (const c of bord) expect(c.h).toBe(0);
    // Autour de la bordure, la rive d'herbe nue, au même niveau : ni cuvette ni talus.
    for (const c of bord)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const v = cells.find((x) => x.x === c.x + dx && x.y === c.y + dy);
        if (v && v.ground !== 'eau' && v.ground !== 'roche') expect([v.ground, v.h, v.decor ?? null], `${v.x},${v.y}`).toEqual(['herbe', 0, null]);
      }
    expect(cells.filter((c) => c.ground === 'herbe').length).toBeGreaterThan(cells.length / 2);
    // Pas de ponton ni de barque.
    expect(cubes.some((q) => q.decor?.startsWith('refuge/ponton'))).toBe(false);
    // Ni cascade : le lac ne déborde pas vers le bord.
    expect(cubes.some((q) => q.tag === 'refuge' && q.decor?.includes('cascade'))).toBe(false);
  });
});

describe('le refuge, sans lanterne', () => {
  it('aucune lanterne, allumée ou non, ni au décor ni aux plans (Blocland, la nuit : rien n’y luit)', () => {
    const { progress, village } = { progress: {}, village: { ...ouvert, plans: Object.fromEntries(plansFor('refuge').map((p) => [p.id, []])) } };
    const cubes = worldCubes('3e', progress, village, false);
    expect(cubes.filter((q) => q.tag === 'refuge' && !q.bridge && (q.texture === 'lanterne' || q.color === BLOCKS.lanterne.side))).toEqual([]);
    for (const etape of buildingStages('refuge', 'bardeau')) expect(etape.some((c) => c.block === 'lanterne')).toBe(false);
  });

  it('en Archipéo, une seule fenêtre peut s’allumer', () => {
    const plans = Object.fromEntries(
      plansFor('refuge').map((p) => [p.id, planCells(p).map((c) => c.key)]),
    );
    const cubes = worldCubes('3e', {}, { ...ouvert, plans }, false);
    expect(cubes.filter((q) => q.tag === 'refuge' && q.color === BLOCKS.bardeau.side).length).toBeGreaterThan(20);
    const vitres = [...fenetresDe(cubes)].filter(([c, f]) => c.tag === 'refuge' && f.genre === 'vitre');
    expect(vitres.length).toBeLessThanOrEqual(1);
    expect([...fenetresDe(cubes)].filter(([c, f]) => c.tag === 'refuge' && !c.bridge && f.genre === 'lanterne')).toEqual([]);
  });
});

describe('les trois plans du refuge', () => {
  const plans = plansFor('refuge');

  it('la poste de Timbre, la salle commune, le pigeonnier du refuge : leurs noms, leurs XP, leurs coffres', () => {
    expect(plans.map((p) => p.name)).toEqual(['La poste de Timbre', 'La salle commune', 'Le pigeonnier du refuge']);
    expect(plans.map((p) => p.reward.xp)).toEqual([40, 50, 60]);
    expect(plans[0].reward.chest.taille).toBe(3);
    expect(plans[2].reward.chest).toMatchObject({ or: 2, cristal: 2 });
    // « poste » en minuscule, jamais « La Poste » ; « refuge » aussi, dans les phrases.
    for (const p of plans) {
      expect(p.done).not.toMatch(/La Poste|Refuge/);
      expect(p.name).not.toMatch(/Poste|Refuge/);
    }
  });

  it('le premier plan ne demande que le bardeau et le bois (le casier à lettres) ; le bardeau et la pierre de taille partout', () => {
    const [poste, salle, pigeonnier] = buildingStages('refuge', 'bardeau');
    expect(new Set(poste.map((c) => c.block))).toEqual(new Set(['bardeau', 'bois']));
    expect(salle.some((c) => c.block === 'taille')).toBe(true);
    expect(pigeonnier.some((c) => c.block === 'taille')).toBe(true);
  });

  it('le pigeonnier : en pierre claire, quatre blocs de haut au plus, un trou d’envol entre deux blocs, la planche-perchoir dessous', () => {
    const [, , cour] = buildingStages('refuge', 'bardeau');
    // Le chantier est retourné d'est en ouest (la caméra du refuge le voit par l'est) : le pigeonnier de x = 0 à 2.
    const pigeonnier = cour.filter((c) => c.x <= 2 && c.y === 0);
    expect(Math.max(...pigeonnier.map((c) => c.z))).toBeLessThanOrEqual(3);
    const en = (x: number, z: number) => pigeonnier.find((c) => c.x === x && c.z === z)?.block;
    expect(en(1, 2)).toBeUndefined();
    for (const [x, z] of [[2, 0], [2, 1], [2, 2], [0, 1], [0, 2]] as const) expect(en(x, z), `${x},${z}`).toBe('taille');
    expect(en(1, 3)).toBe('toit');
    expect(en(1, 1)).toBe('bois');
  });

  it('la poste devant, face à la caméra de l’île : trois rangs de bardeau sous l’avant-toit, sa fenêtre', () => {
    const [poste, finitions] = buildingStages('refuge', 'bardeau');
    const facade = [...poste, ...finitions].filter((c) => c.x === 5 && c.y >= 2 && c.y <= 4 && c.z <= 2);
    expect(facade.filter((c) => c.block === 'bardeau').length).toBe(8);
    expect(facade.filter((c) => c.block === 'verre').length).toBe(1);
    // Rien devant elle, plus haut qu'un bloc (la caisse, le casier sont de côté).
    expect([...poste, ...finitions].some((c) => c.x > 5)).toBe(false);
  });
});

describe('le bardeau', () => {
  const lum = (rgb: number[]) => luminance((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
  const pixels = (kind: 'bardeau' | 'tuile', face: 'top' | 'side') => {
    let s = 1;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => PAINTERS[kind][face](x, y, r)));
  };
  const contraste = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  for (const face of ['top', 'side'] as const)
    it(`${face === 'top' ? 'dessus' : 'côté'} : deux tons, des rangées de quatre, des bardeaux de huit décalés de quatre, le bas arrondi`, () => {
      const p = pixels('bardeau', face);
      const tons = new Set(p.flat().map((c) => c.join(',')));
      expect(tons.size).toBe(2);
      const joint = p[SIZE - 1][0];
      const bois = p[0][0];
      const est = (x: number, y: number, c: number[]) => p[y][x].join(',') === c.join(',');
      for (let y = 0; y < SIZE; y++) {
        // La dernière ligne de chaque rangée : un joint d'un bout à l'autre.
        if (y % 4 === 3) expect(p[y].every((c) => c.join(',') === joint.join(','))).toBe(true);
        // Les deux premières lignes : le bois, sans joint.
        if (y % 4 < 2) expect(p[y].every((c) => c.join(',') === bois.join(','))).toBe(true);
      }
      // Le bas arrondi : à la troisième ligne, deux pixels coupés à chaque coin de chaque bardeau (DA, décision 6), de 0
      // à 1 et de 6 à 7 dans la première rangée, décalés de quatre dans la suivante.
      for (const [y, coins] of [
        [2, [0, 1, 6, 7, 8, 9, 14, 15]],
        [6, [2, 3, 4, 5, 10, 11, 12, 13]],
      ] as const)
        for (let x = 0; x < SIZE; x++) expect(est(x, y, joint), `${x},${y}`).toBe((coins as readonly number[]).includes(x));
      // Le joint brun sombre, à environ 2:1 du bois : il se lit en gris, sans moirer.
      expect(contraste(lum(bois), lum(joint))).toBeGreaterThan(1.7);
      expect(contraste(lum(bois), lum(joint))).toBeLessThan(2.6);
    });

  it('un brun chaud : ni gris comme la pierre, ni orangé comme le cuivre, ni jaune comme l’osier ; plus sombre que la dalle', () => {
    const teinte = (c: number) => {
      const [r, g, b] = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => v / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      return { h: (((max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360), s: max ? d / max : 0 };
    };
    for (const c of [MATIERES.bardeau.cote, parseInt(BLOCKS.bardeau.side.slice(1), 16)]) {
      const t = teinte(c);
      expect(t.h).toBeGreaterThan(20);
      expect(t.h).toBeLessThan(38);
      expect(t.s).toBeGreaterThan(0.25);
      // Moins saturé que le cuivre (#8a5226), plus rouge que l'osier (#b09c5e, ~45°).
      expect(t.s).toBeLessThan(teinte(0x8a5226).s);
      expect(t.h).toBeLessThan(teinte(0xb09c5e).h - 7);
    }
    expect(luminance(MATIERES.bardeau.cote)).toBeLessThan(luminance(MATIERES.dalle.cote));
    expect(luminance(MATIERES.bardeau.cote)).toBeLessThan(luminance(MATIERES.planches.cote));
    expect(luminance(MATIERES.bardeau.cote)).toBeGreaterThan(luminance(MATIERES.lambris.cote));
  });

  it('en gris, son motif n’est pas celui de la tuile : ses joints coupent les coins, ceux de la tuile tombent droit', () => {
    const masque = (kind: 'bardeau' | 'tuile') => {
      const p = pixels(kind, 'side');
      const l = p.map((row) => row.map(lum));
      const moyenne = l.flat().reduce((a, b) => a + b, 0) / (SIZE * SIZE);
      return l.map((row) => row.map((v) => v < moyenne * 0.8));
    };
    const [b, t] = [masque('bardeau'), masque('tuile')];
    let differents = 0;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (b[y][x] !== t[y][x]) differents++;
    expect(differents).toBeGreaterThan(8);
  });
});

describe('le bardeau d’Archipéo', () => {
  it('en gris, ses murs se détachent des rives d’ardoise des toits du 3e', () => {
    const mur = couleurDeMatiere('3e', 'bardeau').cote;
    const rives = couleursDuToit('3e', 'refuge').cote;
    const [a, b] = [luminance(mur), luminance(rives)];
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(2);
  });
});

describe('les nuages des Îles du Ciel', () => {
  it('aucun nuage haut ne commence au-dessus d’une île, le refuge compris : pas de fumée de cheminée (référent dys)', () => {
    const b = worldBounds('3e');
    const nuages = placeDesNuages('3e', b, Math.max(b.maxX - b.minX, b.maxY - b.minY));
    const hauts = nuages.filter((n) => n.y === HAUT_DES_NUAGES.ciel);
    expect(hauts.length).toBe(NUAGES.length);
    for (const n of hauts)
      for (const i of mapOf('3e').map((d) => landBox(d)))
        expect(n.x + n.len <= i.x0 - 3 || n.x >= i.x1 + 3 || n.z + 1.2 <= i.y0 - 3 || n.z >= i.y1 + 3, `${n.x},${n.z}`).toBe(true);
  });

  it('aucun nuage, haut ou bas, ne mord l’îlot d’un Gardien', () => {
    const b = worldBounds('3e');
    const nuages = placeDesNuages('3e', b, Math.max(b.maxX - b.minX, b.maxY - b.minY));
    for (const d of mapOf('3e')) {
      const o = bossIsletOrigin(BIOMES.findIndex((x) => x.id === d.id));
      for (const n of nuages)
        expect(n.x + n.len <= o.x - 3 || n.x >= o.x + ISLET_W - 1 + 3 || n.z + 1.2 <= o.y - 3 || n.z >= o.y + ISLET_H - 1 + 3, `${d.id} ${n.x},${n.z}`).toBe(true);
    }
  });

  it('ailleurs, les nuages restent à leur place d’avant', () => {
    for (const a of ['6e', '5e', '4e'] as const) {
      const b = worldBounds(a);
      const w = Math.max(b.maxX - b.minX, b.maxY - b.minY);
      expect(placeDesNuages(a, b, w)).toEqual(nuagesDe(a).map(([fx, fy, len]) => ({ x: b.minX + fx * w, y: 12, z: b.minY + fy * (b.maxY - b.minY), len })));
    }
  });
});

describe('le bardeau peint en 2D', () => {
  it('ses joints sont ceux de la texture (world/pixels.ts), pixel pour pixel, sur un bloc de 16 × 16', () => {
    const r = () => 0.5;
    const joint = PAINTERS.bardeau.side(0, 3, r).join(',');
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        expect(nuanceDuMotif('ecailles', x, y) === JOINT, `${x},${y}`).toBe(PAINTERS.bardeau.side(x, y, r).join(',') === joint);
  });
});

describe('Timbre en cubes (Blocland)', () => {
  const m = CREATURE_CUBES.refuge;
  const couleurEn = (x: number, y: number, z: number) => m.find((q) => q.x === x && q.y === y && q.z === z)?.color;

  it('la tête plate de cinq sur deux couches, sa rangée de devant crème, deux yeux sombres cernés de crème, sans moustaches', () => {
    const tete = m.filter((q) => q.z >= 4);
    expect(Math.max(...tete.map((q) => q.z))).toBe(5);
    expect(tete.filter((q) => q.z === 4 && q.y === 0).map((q) => q.color)).toEqual(Array(5).fill('#e6d8bc'));
    // Autour des yeux, du crème : ils se détachent du brun, en gris aussi (référent dys).
    expect(tete.filter((q) => q.z === 5 && q.y === 0).sort((p, q) => p.x - q.x).map((q) => q.color)).toEqual(['#e6d8bc', '#1f1a16', '#e6d8bc', '#1f1a16', '#e6d8bc']);
    const yeux = tete.filter((q) => q.color === '#1f1a16');
    expect(yeux.map((q) => [q.x, q.y, q.z])).toEqual([
      [1, 0, 5],
      [3, 0, 5],
    ]);
    // Rien ne dépasse de la tête sur les côtés, devant (pas de moustaches).
    expect(tete.every((q) => q.x >= 0 && q.x <= 4)).toBe(true);
  });

  it('brun-gris : plus sombre que Tunel, plus chaud que Vapeur', () => {
    const couleur = couleurEn(2, 1, 2);
    expect(couleur, 'le corps de Timbre en (2, 1, 2)').toBeDefined();
    const brun = parseInt((couleur ?? '#000000').slice(1), 16);
    expect(luminance(brun)).toBeLessThan(luminance(0x7a5236));
    const [r, , b] = [(brun >> 16) & 255, 0, brun & 255];
    expect(r).toBeGreaterThan(b);
  });

  it('la queue sort de côté, au ras du sol, en marches de trois, deux et un cubes', () => {
    const queue = m.filter((q) => q.x >= 4 && q.z <= 2 && q.y === 2);
    const hauteur = (x: number) => queue.filter((q) => q.x === x).length;
    expect([hauteur(4), hauteur(5), hauteur(6)]).toEqual([3, 2, 1]);
    for (const x of [4, 5, 6]) expect(queue.some((q) => q.x === x && q.z === 0)).toBe(true);
  });

  it('une sacoche fauve de deux sur deux, et sa bandoulière fauve en diagonale sur le devant', () => {
    const fauve = m.filter((q) => q.color === '#a8703a');
    const sacoche = fauve.filter((q) => q.x === 0);
    expect(sacoche.length).toBe(4);
    const bandouliere = fauve.filter((q) => q.x > 0);
    expect(bandouliere.length).toBe(2);
    expect(bandouliere.every((q) => q.y === 0)).toBe(true);
    const [a, b] = bandouliere.sort((p, q) => p.z - q.z);
    expect(b.x - a.x).toBe(1);
  });
});

describe('le Papillon de cuivre en cubes (Blocland)', () => {
  const g = GUARDIAN_CUBES.refuge;
  const [BORD, DEDANS] = ['#b87333', '#8a5226'];
  const en = (x: number, z: number) => g.find((q) => q.x === x && q.z === z);

  it('posé sur un cube plein ; la tête de trois cubes, deux yeux sombres, sans bouche ; deux antennes de deux cubes en marche', () => {
    expect(g.filter((q) => q.z === 0)).toHaveLength(1);
    const tete = g.filter((q) => q.z === 7 && Math.abs(q.x - 5) <= 1);
    expect(tete).toHaveLength(3);
    expect(tete.filter((q) => q.color === '#2a2622').map((q) => q.x).sort()).toEqual([4, 6]);
    for (const c of [-1, 1]) {
      expect(en(5 + c, 8)).toBeDefined();
      expect(en(5 + 2 * c, 9)).toBeDefined();
    }
    // Un seul cube d'épaisseur : ailes, corps et tête dans le même plan.
    expect(new Set(g.map((q) => q.y)).size).toBe(1);
  });

  it('les ailes : un cube vide entre les deux paires, celles du haut plus grandes, en V par leur bord supérieur', () => {
    const antenne = (q: { x: number; z: number }) => q.z >= 8 && Math.abs(q.x - 5) <= 2;
    const aile = (x: number) => g.filter((q) => q.x === x && !antenne(q));
    for (const x of [6, 7, 8]) expect(en(x, 4), `x ${x}`).toBeUndefined();
    const haut = g.filter((q) => q.x > 5 && q.z >= 5 && !antenne(q));
    const bas = g.filter((q) => q.x > 5 && q.z >= 1 && q.z <= 3);
    expect(haut.length).toBeGreaterThan(bas.length);
    // Le bord supérieur monte vers le dehors.
    const sommetDe = (x: number) => Math.max(...aile(x).map((q) => q.z));
    expect(sommetDe(10)).toBeGreaterThan(sommetDe(6));
    // Bord de cuivre clair, intérieur sombre ; symétrique.
    expect(g.some((q) => q.color === DEDANS && q.z >= 5 && q.x > 5)).toBe(true);
    expect(g.some((q) => q.color === BORD && q.z >= 5 && q.x > 5)).toBe(true);
    for (const q of g) expect(g.some((r) => r.x === 10 - q.x && r.z === q.z && r.color === q.color), `${q.x},${q.z}`).toBe(true);
  });

  it('moins de pointes : en haut, chaque aile touche la pointe de son antenne, sans cube vide entre elles', () => {
    const zMax = Math.max(...g.map((q) => q.z));
    const sommet = g.filter((q) => q.z === zMax).map((q) => q.x).sort((a, b) => a - b);
    // L'antenne (x 3 et 7) et l'aile (x 0 à 2, 8 à 10) forment une seule rangée de chaque côté ; la tête reste dégagée.
    expect(sommet).toEqual([0, 1, 2, 3, 7, 8, 9, 10]);
    for (const x of [4, 5, 6]) expect(en(x, zMax), `au-dessus de la tête ${x}`).toBeUndefined();
    for (const x of [3, 7]) expect(en(x, 7), `à côté de la tête ${x}`).toBeUndefined();
  });
});

describe('le Papillon de cuivre d’Archipéo', () => {
  const P = PAPILLON_DE_CUIVRE;
  const aire = (c: readonly (readonly [number, number])[]) => Math.abs(c.reduce((s, [x, y], i) => s + x * c[(i + 1) % c.length][1] - c[(i + 1) % c.length][0] * y, 0)) / 2;

  it('un V franc : la pointe des ailes du haut bien au-dessus des épaules ; les ailes du haut plus grandes que celles du bas', () => {
    expect(Math.max(...P.haute.map((p) => p[1]))).toBeGreaterThanOrEqual(P.epaule + 2.5);
    expect(aire(P.haute)).toBeGreaterThan(2 * aire(P.basse));
    // L'aile du bas pend près du corps : pas une croix (elle s'écarte moins de la moitié de l'aile du haut).
    expect(Math.max(...P.basse.map((p) => p[0]))).toBeLessThan(0.6 * Math.max(...P.haute.map((p) => p[0])));
  });

  it('les fils suivent le contour des ailes, jamais des rayons : chaque sommet d’un fil est près du bord de son aile', () => {
    const f = sentinelleEnFacettes({ ...STATUES.refuge, tour: undefined });
    const veines = f.table.findIndex((p) => p.nom === 'veines');
    const distanceAuBord = (px: number, py: number, c: readonly (readonly [number, number])[]) => {
      let d = Infinity;
      for (let i = 0; i < c.length; i++) {
        const [a, b] = [c[i], c[(i + 1) % c.length]];
        const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
        const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
        d = Math.min(d, Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy));
      }
      return d;
    };
    let surLesAiles = 0;
    for (let t = 0; t < f.pieces.length; t++) {
      if (f.pieces[t] !== veines) continue;
      for (let k = 0; k < 3; k++) {
        const [x, y, z] = [f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]];
        if (Math.abs(x) < 0.1) continue; // le fil du corps
        // Ramené dans le plan de l'aile (à peine ouverte), en valeur absolue.
        const u = (Math.hypot(Math.abs(x) - P.racine, z) * Math.sign(Math.abs(x) - P.racine));
        const c = y > 3.75 ? P.haute : P.basse;
        expect(distanceAuBord(u, y, c), `${x.toFixed(2)},${y.toFixed(2)}`).toBeLessThan(0.3);
        surLesAiles++;
      }
    }
    expect(surLesAiles).toBeGreaterThan(0);
  });

  it('dans le monde, ses ailes se montrent de face aux caméras du Refuge (77°), du Château (19°) et du rallumage (85°)', () => {
    const f = sentinellePeinte('refuge');
    const sculpture = f.table.findIndex((p) => p.nom === 'sculpture');
    const lichen = [...f.teintes.keys()].filter((t) => f.teintes[t] === SENTINELLE.lichen && f.pieces[t] === sculpture);
    expect(lichen.length).toBeGreaterThan(0);
    expect(ANGLE_DU_PAPILLON).toBe(52);
    for (const deg of [19, 77, 85]) {
      const [cx, cz] = [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
      // Chaque aile, ouverte de `ouverture`, reste à moins de 50° de la caméra : jamais vue par la tranche.
      for (const t of lichen) expect(cx * f.normals[t * 9] + cz * f.normals[t * 9 + 2], `${deg}°`).toBeGreaterThan(Math.cos((50 * Math.PI) / 180));
    }
  });
});

describe('les caméras des îles', () => {
  // Le pivot de chaque caméra d'île avant le refuge (main, en degrés) : le refuge ne le change pour aucune autre île, dans
  // aucun archipel (DA, LV2-5). La Ferme, la Mine et la Baie, écartées de deux cases quand le cœur de la Forêt est passé
  // à 20 (01/10/2026), pivotent de 1,6° de plus vers la colonne centrale (32, −23,2 et 23,2 avant). Aux Îles
  // Brumeuses, le cœur du Marché passé à 20 (01/10/2026) : le Glacier écarté de deux cases vers l'ouest, la colonne
  // centrale y recule d'une case, et les caméras tournent de 0,8° (le Comptoir et le Manoir, écartés vers l'est, de
  // 2,4°) ; avant : Glacier 36,8, Marché 13,6, Carrefour 36,8, Marais 13,6, Comptoir et Manoir −12, Relais −37,6. Aux
  // Anciens Ateliers, le cœur de l'Atelier passé à 20 (01/10/2026) : la Falaise, écartée de deux cases vers l'est, tourne
  // de 1,6° (−0,4 avant) ; la Forge, écartée vers l'ouest, reste au pivot maximal.
  const AVANT_LE_REFUGE: Record<string, number> = { foret: 0, ferme: 33.6, mine: -24.8, tour: 40, carriere: -40, plaine: 2.4, riviere: -33.6, volcan: 36.8, baie: 24.8, horloge: -0.8, glacier: 37.6, marche: 12.8, carrefour: 36, marais: 12.8, comptoir: -14.4, manoir: -14.4, relais: -38.4, forge: 40, atelier: 25.2, falaise: -2, cabinet: -26, theatre: -40, jardin: -40, gare: 40, belvedere: 30.4, phare: 0, donnees: -30.4, textes: 0, studio: 40, chateau: -40 };
  it('gardent le cadrage d’avant le refuge, dans chaque archipel', () => {
    for (const [ile, deg] of Object.entries(AVANT_LE_REFUGE))
      expect((viewYaw(ile as BiomeId) * 180) / Math.PI, ile).toBeCloseTo(deg, 3);
  });
  it('seules des îles de LV2 sortent de la colonne centrale', () => {
    for (const id of HORS_DE_LA_COLONNE) {
      const b = BIOMES.find((x) => x.id === id);
      expect(b && estIleLv2(b), id).toBe(true);
    }
  });
});
