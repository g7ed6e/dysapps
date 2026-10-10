// Les kits des Anciens Ateliers (4e) et des Îles du Ciel (3e) (./kits/4e.ts, ./kits/3e.ts ; intention du directeur
// artistique du 10 octobre 2026) : l'écart au fantôme mesuré sur le maillage, toits enneigés compris ; la Halle du 3e
// sans colombage ; les grands projets lus pièce par pièce ; la lueur de fin ; la coupole de l'observatoire des étoiles ;
// les pièces nouvelles du reste.
import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { batimentsDe, caseDuLieu, coursDe, fenetresDe, maillageDeLaConstruction } from '../construction';
import { allumesALaFin, LUEUR_DE_FIN } from '../construction/endGlow';
import { couleurDuRole } from '../construction/settings';
import { getMonument, monumentsOf } from '../monuments';
import { BRUME } from '../palette';
import { planCells, plansFor } from '../plans';
import { LAYERS } from '../projects';
import { toitDe } from '../roofs';
import { worldCubes } from '../terrain';
import { apartFromGhost, lowGlazing, lyingTube, rgbGap, standingBoard } from './heartPieces';
import { trianglesDe } from './rooms';
import { architectureDe, KITS, kitVide, type Architecture } from '.';

const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
/** Une couleur linéaire de Three.js (0 à 1) ramenée en sRGB (0 à 255), pour mesurer son écart au fantôme. */
const srgb = (v: number) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
const hexDe = (c: ArrayLike<number>, i: number) => (srgb(c[i]) << 16) | (srgb(c[i + 1]) << 8) | srgb(c[i + 2]);
const ECART = 70;

const { progress, world: village } = toutConstruit();
const mondes = new Map<string, VoxelCube[]>();
/** Les blocs d'un archipel tout construit (la Halle d'Archipéo), sans le sol ni le décor. */
function monde(a: '4e' | '3e'): VoxelCube[] {
  let m = mondes.get(a);
  if (!m) mondes.set(a, (m = worldCubes(a, progress, village, false, [], false, 'halle').filter((c) => !c.sol && !c.decor)));
  return m;
}

/**
 * Le plus petit écart au fantôme d'un maillage (l'opaque et les fenêtres), et sa couleur. Hors le liseré des mares (le
 * verre posé au sol : une bande de 0,06 case autour de la nappe bleue, dans le rôle `lisere` du kit, Brume comme au 6e et
 * au 5e, qu'on ne prend pas pour une case à poser).
 */
function auPlusPres(a: '4e' | '3e', m: ReturnType<typeof maillageDeLaConstruction>): { ecart: number; hex: number } {
  const lisere = couleurDuRole(a, KITS[a], 'lisere');
  let out = { ecart: Infinity, hex: 0 };
  for (const colors of [m.opaque.colors, m.fenetres.colors])
    for (let i = 0; i < colors.length; i += 3) {
      const hex = hexDe(colors, i);
      if (rgbGap(hex, lisere) <= 3) continue;
      const e = rgbGap(hex, BRUME);
      if (e < out.ecart) out = { ecart: e, hex };
    }
  return out;
}

describe('Les kits du 4e et du 3e : l’écart au fantôme (référent dys)', () => {
  it('chaque matière tenue à l’écart, île par île, et le toit d’ardoise du 3e : à 70 au moins de Brume à l’écran ; sans le kit, non', () => {
    for (const a of ['4e', '3e'] as const) {
      const kit = KITS[a];
      const tenues = new Set<string>([...(kit.ghostApart ?? []), ...(a === '3e' ? ['toit'] : [])]);
      let tropPresSansKit = 0;
      const parIle = new Map<string, VoxelCube[]>();
      for (const c of monde(a)) if (tenues.has(c.texture ?? '') && !c.ghost) parIle.set(`${c.tag}|${c.texture}`, [...(parIle.get(`${c.tag}|${c.texture}`) ?? []), c]);
      expect(parIle.size, a).toBeGreaterThan(0);
      for (const [k, cubes] of parIle) {
        const { ecart, hex } = auPlusPres(a, maillageDeLaConstruction(a, cubes));
        // Après l'aller et retour en linéaire et son arrondi (la marge d'un point d'`apartFromGhost`).
        expect(ecart, `${a} ${k} ${hex.toString(16)}`).toBeGreaterThanOrEqual(ECART);
        if (auPlusPres(a, maillageDeLaConstruction(a, cubes, [], { kit: kitVide() })).ecart < ECART) tropPresSansKit++;
      }
      expect(tropPresSansKit, a).toBeGreaterThan(0);
    }
  }, 120_000);

  it('le 3e : le dessus des toits d’ardoise du bâti dans la neige #B3C1C7 ; le 4e et le 5e n’ont pas de toits enneigés', () => {
    expect(KITS['3e'].snowyRoofs).toBe(true);
    expect(KITS['4e'].snowyRoofs).toBeUndefined();
    expect(KITS['5e'].snowyRoofs).toBeUndefined();
    expect(KITS['3e'].couleurs.snow).toBe(0xb3c1c7);
    // Sous le voile de l'archipel, la neige se rapproche de Brume : le kit l'en tient à l'écart.
    expect(rgbGap(apartFromGhost(couleurDuRole('3e', KITS['3e'], 'snow')), BRUME)).toBeGreaterThanOrEqual(ECART);
    // Les rôles clairs des murs (le remplissage du 4e, la pierre de taille du 3e) : à 70 au moins, sous le voile.
    expect(rgbGap(couleurDuRole('4e', KITS['4e'], 'remplissage'), BRUME)).toBeGreaterThanOrEqual(ECART);
    expect(rgbGap(couleurDuRole('3e', KITS['3e'], 'masonry'), BRUME)).toBeGreaterThanOrEqual(ECART);
    const toits = monde('3e').filter((c) => c.texture === 'toit' && !c.ghost && !c.place);
    expect(toits.length).toBeGreaterThan(0);
    const { colors, normals } = maillageDeLaConstruction('3e', toits).opaque;
    const dessus = new Set<number>();
    // Le maillage est dans le repère de Three.js : la hauteur est le deuxième axe.
    for (let i = 0; i < colors.length; i += 3) if (normals[i + 1] > 0.5) dessus.add(hexDe(colors, i));
    expect([...dessus].some((h) => rgbGap(h, 0xb3c1c7) <= 3), [...dessus].map((h) => h.toString(16)).join(' ')).toBe(true);
  }, 60_000);
});

describe('Les kits du 4e et du 3e : les lieux', () => {
  it('le 4e : l’école et les piliers de la salle en mur plein #6F473D, la Halle en colombage ; le 3e : en mur plein #C2BBAD, la Halle bardée, sans colombage', () => {
    expect(KITS['4e'].couleurs.masonry).toBe(0x6f473d);
    expect(KITS['3e'].couleurs.masonry).toBe(0xc2bbad);
    for (const a of ['4e', '3e'] as const) {
      const tous = monde(a);
      const archi = architectureDe(a, tous, { batiments: batimentsDe(a), cours: coursDe(a), caseDuLieu });
      const ecole = tous.filter((c) => c.place === 'school' && (c.texture === 'brique' || c.texture === 'taille') && (caseDuLieu(c)?.z ?? 9) <= 3);
      expect(ecole.length, a).toBeGreaterThan(0);
      for (const c of ecole) expect(archi.peints.get(cle(c))?.peinture.fond, `${a} ${cle(c)}`).toBe('masonry');
      const piliers = [...archi.peints.values()].filter((p) => p.cube.place === 'trophies' && p.peinture.fond === 'masonry');
      expect(piliers.length, a).toBeGreaterThan(0);
      const halle = [...archi.peints.values()].filter((p) => p.cube.place === 'assembly');
      expect(halle.length, a).toBeGreaterThan(0);
      const colombage = halle.filter((p) => p.peinture.fond === 'remplissage');
      if (a === '4e') expect(colombage.length, a).toBeGreaterThan(0);
      else {
        // Ni colombage nulle part au 3e : ni la Halle, ni un bâtiment.
        expect(colombage, a).toEqual([]);
        expect([...archi.peints.values()].filter((p) => p.peinture.fond === 'remplissage').map((p) => cle(p.cube))).toEqual([]);
        expect(halle.some((p) => p.peinture.fond === 'masonry'), a).toBe(true);
      }
    }
  }, 60_000);
});

/** Ce que l'architecture dessine d'un bloc, sans son dessus (que la pièce suivante cache) : comparé d'une étape à l'autre. */
function dessinDe(archi: Architecture, c: VoxelCube): string {
  const k = cle(c);
  const peint = archi.peints.get(k);
  const piece = archi.pieces.find((p) => p.cube === c);
  const lisse = archi.lisses.get(k);
  return JSON.stringify({ cotes: peint?.peinture.motifs.slice(0, 4), fond: peint?.peinture.fond, piece: piece ? trianglesDe(piece.dessin) > 0 : null, lisse: lisse?.cases ?? null, remplacee: archi.remplacees.has(k) });
}

describe('Les kits du 4e et du 3e : les grands projets, pièce par pièce', () => {
  const projets = (['4e', '3e'] as const).flatMap((a) => monumentsOf(a).filter((m) => LAYERS[m.id]).map((m) => ({ a, m })));

  it('il y en a cinq : le portique des docks, la tour des signaux, la fusée, le château d’eau, la colonne des solides', () => {
    expect(projets.map(({ m }) => m.id).sort()).toEqual(['landmark-3e-3', 'landmark-3e-4', 'landmark-3e-5', 'landmark-4e-3', 'landmark-4e-4']);
  });

  it('chaque pièce finie se dessine finie : poser les suivantes ne change pas ce qui est en dessous (les côtés, le soubassement, le volume lissé)', () => {
    for (const { a, m } of projets) {
      const cellules = planCells(m);
      const lieu = `monument:${m.id}`;
      const etape = (haut: number) => {
        const parts = { ...village.parts, [m.id]: cellules.filter((c) => c.z <= haut).map((c) => c.key) };
        const tous = worldCubes(a, progress, { ...village, parts }, false, [], false, 'halle').filter((c) => !c.sol && !c.decor && c.tag === m.biome);
        return { tous, archi: architectureDe(a, tous, { batiments: batimentsDe(a), cours: coursDe(a), caseDuLieu }) };
      };
      const fin = etape(Infinity);
      const pied = Math.min(...fin.tous.filter((c) => c.place === lieu).map((c) => c.z));
      const finParCase = new Map(fin.tous.filter((c) => c.place === lieu).map((c) => [cle(c), c]));
      const couches = Object.values(LAYERS[m.id]);
      for (const [, haut] of couches.slice(0, -1)) {
        const { tous, archi } = etape(haut);
        const poses = tous.filter((c) => c.place === lieu && !c.ghost);
        expect(poses.length, `${m.id} ${haut}`).toBeGreaterThan(0);
        for (const c of poses) {
          // Le rang du haut de la pièce : son dessus se cache sous la pièce suivante, ses côtés ne changent pas.
          const f = finParCase.get(cle(c))!;
          expect(dessinDe(archi, c), `${m.id} jusqu’à ${haut} : ${cle(c)} (${c.texture}, rang ${c.z - pied})`).toBe(dessinDe(fin.archi, f));
        }
      }
    }
  }, 120_000);

  it('la lueur de fin : le bloc `litWhenDone` d’un grand projet fini prend la lueur des fenêtres, allumée la première ; pas avant la fin, ni sur une île fermée', () => {
    expect(LUEUR_DE_FIN).toBe(true);
    for (const { a, m } of projets) {
      const def = getMonument(m.id)!;
      expect(def.litWhenDone, m.id).toBeDefined();
      const tous = monde(a).filter((c) => c.place === `monument:${m.id}`);
      const allumes = allumesALaFin(tous);
      expect(allumes.size, m.id).toBeGreaterThan(0);
      for (const c of allumes) expect(c.lit, m.id).toBe(true);
      const f = fenetresDe(tous);
      for (const c of allumes) expect(f.get(c), `${m.id} ${cle(c)}`).toEqual({ genre: 'lueur', decalage: 0 });
      // Délavés (une île fermée) : éteints.
      expect(allumesALaFin(tous.map((c) => ({ ...c, muted: true }))).size, m.id).toBe(0);
      // Pas fini : rien n'est allumé.
      const cellules = planCells(m);
      const parts = { ...village.parts, [m.id]: cellules.slice(0, -1).map((c) => c.key) };
      const avant = worldCubes(a, progress, { ...village, parts }, false, [], false, 'halle').filter((c) => c.place === `monument:${m.id}`);
      expect(allumesALaFin(avant).size, m.id).toBe(0);
    }
  }, 60_000);
});

describe('La lueur de fin et les lanternons (retouches du 10 octobre 2026)', () => {
  interface Tri {
    /** La case du triangle, rentrée d'un quart de case sous sa normale (grille : x, y, hauteur). */
    case: string;
    /** Sa normale (repère Three : x, hauteur, y). */
    n: [number, number, number];
    /** Ses trois sommets, en grille (x, y). */
    xy: [number, number][];
  }
  /** Les triangles d'un groupe du maillage. */
  const trisDe = (g: { positions: ArrayLike<number>; normals: ArrayLike<number>; indices: ArrayLike<number> }): Tri[] => {
    const out: Tri[] = [];
    for (let t = 0; t < g.indices.length; t += 3) {
      const ids = [g.indices[t], g.indices[t + 1], g.indices[t + 2]];
      const c = [0, 1, 2].map((k) => ids.reduce((s, i) => s + g.positions[3 * i + k], 0) / 3);
      const n: [number, number, number] = [g.normals[3 * ids[0]], g.normals[3 * ids[0] + 1], g.normals[3 * ids[0] + 2]];
      out.push({
        case: `${Math.floor(c[0] - n[0] * 0.25)},${Math.floor(c[2] - n[2] * 0.25)},${Math.floor(c[1] - n[1] * 0.25)}`,
        n,
        xy: ids.map((i) => [g.positions[3 * i], g.positions[3 * i + 2]]),
      });
    }
    return out;
  };

  it('la lueur ne prend que les faces verticales ; le dessus d’un bloc allumé reste dans l’opaque', () => {
    let dessus = 0;
    for (const a of ['4e', '3e'] as const) {
      for (const m of monumentsOf(a).filter((x) => LAYERS[x.id])) {
        const tous = monde(a).filter((c) => c.place === `monument:${m.id}`);
        const allumes = new Set([...allumesALaFin(tous)].map(cle));
        const mesh = maillageDeLaConstruction(a, tous);
        const lueur = trisDe(mesh.fenetres).filter((t) => allumes.has(t.case));
        expect(lueur.length, m.id).toBeGreaterThan(0);
        for (const t of lueur) expect(t.n[1], m.id).toBe(0);
        dessus += trisDe(mesh.opaque).filter((t) => t.n[1] > 0.5 && allumes.has(t.case)).length;
      }
    }
    // Les dessus vus (celui de la cabine du portique est sous la poutre).
    expect(dessus).toBeGreaterThan(0);
  }, 60_000);

  it('les huit lanternons du château d’eau : chacun en retrait de sa case, un joint entre deux voisins', () => {
    const tous = monde('3e').filter((c) => c.place === 'monument:landmark-3e-4');
    const lanternons = tous.filter((c) => KITS['3e'].insetBlocks?.(c));
    expect(lanternons.length).toBe(8);
    for (const a of ['6e', '5e', '4e'] as const) expect(KITS[a].insetBlocks, a).toBeUndefined();
    const cases = new Set(lanternons.map(cle));
    for (const k of cases) expect(new Set([...allumesALaFin(tous)].map(cle)).has(k)).toBe(true);
    // Finis (allumés), puis sur une île fermée (délavés, éteints) : chacun en retrait.
    for (const m3 of [tous, tous.map((c) => ({ ...c, muted: true }))]) {
      const mesh = maillageDeLaConstruction('3e', m3);
      let vus = 0;
      for (const t of [...trisDe(mesh.opaque), ...trisDe(mesh.fenetres)]) {
        if (!cases.has(t.case)) continue;
        vus++;
        const [x, y] = t.case.split(',').map(Number);
        for (const [px, py] of t.xy)
          for (const v of [px - x, py - y]) {
            expect(v).toBeGreaterThan(0.05);
            expect(v).toBeLessThan(0.95);
          }
      }
      expect(vus).toBe(8 * 5 * 2);
    }
  });
});

describe('Les kits du 4e et du 3e : les monuments et le reste', () => {
  it('la coupole de lentilles de l’observatoire des étoiles : un toit en pavillon sur son rang bas, la verrière au faîte, plus aucun gradin', () => {
    const tous = monde('3e');
    const archi = architectureDe('3e', tous, { batiments: batimentsDe('3e'), cours: coursDe('3e'), caseDuLieu });
    const coupole = tous.filter((c) => c.place === 'monument:landmark-3e-1' && c.texture === 'lentille');
    const base = Math.min(...coupole.map((c) => c.z));
    expect(coupole.length).toBe(21 + 5);
    const pieceDe = (c: VoxelCube) => archi.pieces.find((p) => p.cube === c);
    for (const c of coupole) expect(pieceDe(c), cle(c)).toBeDefined();
    // Le rang bas en pente ; le rang du dessus ne dessine rien, sauf la case du milieu, qui porte la verrière.
    const enPente = coupole.filter((c) => c.z === base && pieceDe(c)!.facettes.some((f) => f.normale[2] > 0 && f.normale[2] < 1));
    expect(enPente.length).toBe(21 - 1);
    const haut = coupole.filter((c) => c.z === base + 1);
    expect(haut.filter((c) => pieceDe(c)!.facettes.length > 0)).toHaveLength(1);
  });

  it('le faîte de miroirs du temple : une verrière basse d’un tenant ; son toit de prismes peint à plat', () => {
    const tous = monde('3e');
    const archi = architectureDe('3e', tous, { batiments: batimentsDe('3e'), cours: coursDe('3e'), caseDuLieu });
    const temple = tous.filter((c) => c.place === 'monument:landmark-3e-2' && !c.ghost);
    const miroirs = temple.filter((c) => c.texture === 'miroir');
    expect(miroirs.length).toBeGreaterThan(0);
    for (const c of miroirs) expect(archi.pieces.find((p) => p.cube === c)?.rotation, cle(c)).toBe(1);
    const prismes = temple.filter((c) => c.texture === 'prisme');
    expect(prismes.length).toBeGreaterThan(0);
    for (const c of prismes) expect(archi.peints.get(cle(c))?.peinture.motifs, cle(c)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('les pièces nouvelles du reste coûtent au plus un cube (10 triangles) et tiennent dans leur case', () => {
    for (const [nom, d] of [
      ['tube couché le long de x', lyingTube(true)],
      ['tube couché le long de y', lyingTube(false)],
      ['planche debout', standingBoard()],
      ['verrière basse', lowGlazing()],
    ] as const) {
      expect(trianglesDe(d), nom).toBeLessThanOrEqual(10);
      for (const f of d.facettes) for (const p of f.points) for (const v of p) expect(v >= -1e-9 && v <= 1 + 1e-9, nom).toBe(true);
    }
  });
});

describe('Le 3e : un toit sous la neige en chantier', () => {
  /** Le point (x, y) du plan horizontal à la hauteur `h` est-il sous un triangle tourné vers le haut du groupe ? */
  function couvert(g: { positions: Float32Array; normals: Float32Array; indices: Uint32Array }, x: number, y: number, h: number): boolean {
    const { positions: p, normals: n, indices } = g;
    // Le maillage est dans le repère de Three.js : (x, hauteur, y).
    for (let t = 0; t < indices.length; t += 3) {
      const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]];
      if (n[3 * a + 1] < 0.5 || Math.abs(p[3 * a + 1] - h) > 1e-4 || Math.abs(p[3 * b + 1] - h) > 1e-4 || Math.abs(p[3 * c + 1] - h) > 1e-4) continue;
      const cote = (i: number, j: number) => (p[3 * j] - p[3 * i]) * (y - p[3 * i + 2]) - (p[3 * j + 2] - p[3 * i + 2]) * (x - p[3 * i]);
      const [s1, s2, s3] = [cote(a, b), cote(b, c), cote(c, a)];
      if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return true;
    }
    return false;
  }

  it('le toit de la lanterne de Fi à moitié posé : ses cases encore à poser restent des fantômes, que la neige du toit posé ne couvre pas', () => {
    expect(KITS['3e'].snowyRoofs).toBe(true);
    expect(toitDe('maths-3e-functions')).toBe('ardoise');
    const plan = plansFor('maths-3e-functions').find((p) => planCells(p).some((c) => c.block === 'roof'))!;
    const cellules = planCells(plan);
    const toit = cellules.filter((c) => c.block === 'roof');
    const ouest = Math.min(...toit.map((c) => c.x));
    const parts = { ...village.parts, [plan.id]: cellules.filter((c) => c.block !== 'roof' || c.x === ouest).map((c) => c.key) };
    const ile = worldCubes('3e', progress, { ...village, parts }, false, [], false, 'halle').filter((c) => !c.sol && !c.decor && c.tag === 'maths-3e-functions');
    const fantomes = ile.filter((c) => c.ghost && c.texture === 'toit');
    const poses = ile.filter((c) => !c.ghost && c.texture === 'toit' && fantomes.some((f) => f.z === c.z && Math.abs(f.x - c.x) + Math.abs(f.y - c.y) === 1));
    expect(fantomes).toHaveLength(toit.length - toit.filter((c) => c.x === ouest).length);
    expect(poses.length).toBeGreaterThan(0);
    const m = maillageDeLaConstruction('3e', ile);
    for (const f of fantomes) {
      expect(couvert(m.fantomes, f.x + 0.5, f.y + 0.5, f.z + 1), `fantôme ${cle(f)}`).toBe(true);
      expect(couvert(m.opaque, f.x + 0.5, f.y + 0.5, f.z + 1), `neige sur ${cle(f)}`).toBe(false);
    }
    // La moitié posée, elle, est bien couverte de son toit, sans fantôme.
    for (const c of poses) {
      expect(couvert(m.opaque, c.x + 0.5, c.y + 0.5, c.z + 1), `toit ${cle(c)}`).toBe(true);
      expect(couvert(m.fantomes, c.x + 0.5, c.y + 0.5, c.z + 1), `fantôme sur ${cle(c)}`).toBe(false);
    }
  }, 60_000);
});
