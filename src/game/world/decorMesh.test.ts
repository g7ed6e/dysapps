import type { VoxelCube } from './cube';
import { toutConstruit } from './budget';
import { DECOR_BATI } from './decor';
import { caseDuDecor, coutDuDecor, ENFONCE, enPrimitives, FAMILLES, FEUILLAGE, FUMEE, maillageDuDecor, rangerLeDecor, TAILLES, valeur, type ElementDeDecor } from './decorMesh';
import { couleurDuSol } from './palette';
import { champDuSol, colonneEn, hauteurDuSol, pickCell, piedsSur, type ChampDuSol } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId, inCore, islandDef, landscape } from './map';
import { buildMesh, faceCount } from './mesher';
import { ECLAT_DU_FUT, OMBRE_DU_FUT } from './decor/lighthouse';
import { COULEURS_4E } from './decor/4e';
import { empriseDuSocle, SOCLE_3E } from './decor/3e';
import { eclaircir, hex } from './decor/brush';
import { kindOf, PROP_KINDS } from './props';
import { worldCubes } from './terrain';

/** Un archipel tout construit, rangé comme le rend la vue 3D d'Archipéo. */
const ranges = new Map<ArchipelagoId, ReturnType<typeof ranger>>();
function ranger(a: ArchipelagoId, vide = false) {
  const { progress, world: village } = toutConstruit();
  const cubes = vide ? worldCubes(a, {}) : worldCubes(a, progress, village, false);
  const sol = cubes.filter((c) => c.sol);
  const autres = cubes.filter((c) => !c.sol);
  const { elements, reste } = rangerLeDecor(autres);
  const champ = champDuSol(a, sol, reste);
  return { cubes, sol, autres, elements, reste, champ, avant: champDuSol(a, sol, autres), maillage: maillageDuDecor(a, champ, elements) };
}
const monde = (a: ArchipelagoId) => {
  let r = ranges.get(a);
  if (!r) ranges.set(a, (r = ranger(a)));
  return r;
};
/** Les triangles d'un élément : leurs sommets. */
function sommets(m: ReturnType<typeof ranger>['maillage'], i: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const f = m.decor;
  for (let t = 0; t < f.elements.length; t++) if (f.elements[t] === i) for (let k = 0; k < 3; k++) out.push([f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]]);
  return out;
}
const surTerre = (champ: ChampDuSol, e: ElementDeDecor) => Boolean(colonneEn(champ, e.x, e.y));

it('range le décor en éléments : arbres, rochers, repères, cascades et mer ; le reste garde ses cubes', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { autres, elements, reste } = monde(a);
    // Rien ne se perd, rien ne se copie.
    expect(reste.length + elements.reduce((n, e) => n + e.cubes.length, 0), a).toBe(autres.length);
    expect(reste.some(enPrimitives), a).toBe(false);
    for (const e of elements) {
      expect([...PROP_KINDS, ...DECOR_BATI], e.id).toContain(e.genre);
      for (const c of e.cubes) expect(c.decor).toBe(e.id);
    }
    // Les objets du quai (barque, caisses, fanions, foyer) restent en cubes, comme le décor du cœur sans nom.
    expect(reste.some((c) => c.decor && kindOf(c.decor) === 'barque'), a).toBe(a !== '3e');
    expect(new Set(elements.map((e) => e.id)).size).toBe(elements.length);
  }
  expect(monde('6e').elements.some((e) => e.genre === 'arbre')).toBe(true);
  expect(monde('3e').elements.some((e) => e.genre === 'grand-phare')).toBe(true);
});

it('plus de socle plat sous le décor : ses cases rejoignent la pente du sol', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { champ, avant, elements, reste } = monde(a);
    // Les cases où il n'y a plus que du décor ne sont plus figées ; celles où il y a autre chose le restent.
    const autreChose = new Set(reste.filter((c) => !c.sol).map((c) => `${c.x},${c.y},${c.z}`));
    let liberees = 0;
    let enPente = 0;
    for (const e of elements) {
      const col = colonneEn(champ, e.x, e.y);
      if (!col) continue;
      const figee = autreChose.has(`${e.x},${e.y},${col.haut + 1}`);
      if (figee) continue;
      const vieille = colonneEn(avant, e.x, e.y)!;
      if (vieille.fixe && !col.fixe) liberees++;
      if (Math.max(...col.coins) - Math.min(...col.coins) > 0.2) enPente++;
    }
    expect(liberees, a).toBeGreaterThan(10);
    expect(enPente, a).toBeGreaterThan(5);
    // Plus aucun décor en primitives ne descend avec sa case (le décor resté en cubes, oui).
    for (const id of champ.decorsAbaisses.keys()) expect(elements.some((e) => e.id === id), id).toBe(false);
  }
});

it('chaque élément du décor est posé sur la pente, au milieu de sa case, sans flotter', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { champ, elements, maillage } = monde(a);
    elements.forEach((e, i) => {
      const pts = sommets(maillage, i);
      if (!pts.length) return;
      const bas = Math.min(...pts.map((p) => p[1]));
      // (Le ponton du Jardin descend la falaise jusqu'à l'eau.)
      if (e.genre === 'fumee' || e.genre === 'ecueil' || e.genre === 'banc' || e.genre === 'cascade' || e.genre === 'ponton') return;
      if (!surTerre(champ, e)) return;
      const w = e.emprise;
      // Le pied touche le sol (ou s'y enfonce), au plus bas de son emprise pour un repère de plusieurs cases. Le grand
      // phare des Îles du Ciel se pose sur l'emprise de son socle, plus large que le phare de Blocland (R4b-3e).
      const socle = a === '3e' && e.genre === 'grand-phare' ? { ...empriseDuSocle(e), w: SOCLE_3E.cote } : { x0: e.x, y0: e.y, w };
      let solBas = Infinity;
      for (const u of [0.1, 0.5, 0.9]) for (const v of [0.1, 0.5, 0.9]) solBas = Math.min(solBas, hauteurDuSol(champ, socle.x0 + u * socle.w, socle.y0 + v * socle.w) ?? Infinity);
      // (Un buisson de deux cases : chacune sur son sol.)
      const cases = e.genre === 'buisson' ? e.cubes : [{ x: e.x, y: e.y }];
      const sol = !DECOR_BATI.has(e.genre) ? Math.min(...cases.map((c) => hauteurDuSol(champ, c.x + 0.5, c.y + 0.5) ?? Infinity)) : solBas;
      expect(bas, `${a} ${e.id}`).toBeLessThanOrEqual(sol + 0.01);
      expect(bas, `${a} ${e.id}`).toBeGreaterThanOrEqual(sol - ENFONCE - 0.5);
      // Au milieu de sa case : le décor d'une case est centré sur elle (à la variation près).
      if (w === 1 && PROP_KINDS.includes(e.genre as never) && e.cubes.length <= 2) {
        const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const mz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
        // (Un buisson : sur ses cases à lui.)
        const ox = e.genre === 'buisson' ? e.cubes.reduce((t, c) => t + c.x, 0) / e.cubes.length : e.x;
        const oy = e.genre === 'buisson' ? e.cubes.reduce((t, c) => t + c.y, 0) / e.cubes.length : e.y;
        expect(Math.abs(mx - (ox + 0.5)) + Math.abs(mz - (oy + 0.5)), `${a} ${e.id}`).toBeLessThan(0.6);
      }
    });
  }
}, 30_000);

it('l’habillage de la mer affleure, la cascade tombe du bord de sa case jusqu’à l’eau', () => {
  const { elements, maillage } = monde('5e');
  const mer = elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'ecueil' || e.genre === 'banc');
  expect(mer.length).toBeGreaterThan(20);
  for (const { e, i } of mer) {
    const pts = sommets(maillage, i);
    // Sous l'eau, et au-dessus : on le voit de la côte.
    expect(Math.min(...pts.map((p) => p[1])), e.id).toBeLessThan(-0.45);
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeGreaterThan(-0.45);
  }
  // Aux Îles Brumeuses, huit cascades jusqu'à GD-11 (celle du Relais des voyageurs, LV2, qui a son lac, celles du Bourg
  // des chroniques et du Delta des ressources, HG-3, deux de plus avec les îles de sciences, SC-3) ; trois depuis que
  // les îles ont grandi (GD-11, 8 octobre 2026), aucune depuis leurs formes (GD-12, 9 octobre 2026) : une île qui a sa
  // forme a une côte plate. Celles des Anciens Ateliers partent avec leurs formes (GD-12, 9 octobre 2026) : une île qui a
  // sa forme n'a plus de mare, d'où l'eau débordait. Restent les deux des Îles du Ciel, jusqu'à leurs formes ; chacune
  // tombe du bord de sa case jusqu'à la mer.
  for (const a of ARCHIPELAGO_IDS.filter((a) => a !== '3e')) expect(monde(a).elements.filter((e) => e.genre === 'cascade'), a).toEqual([]);
  const ateliers = monde('3e');
  const CASCADES_SUR_LA_GREVE = ['english-3e-comprehension/cascade@5,932', 'english-3e-grammar/cascade@138,932'];
  const cascades = ateliers.elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'cascade');
  expect(cascades.length).toBe(2);
  for (const { e, i } of cascades) {
    const pts = sommets(ateliers.maillage, i);
    const col = colonneEn(ateliers.champ, e.x, e.y)!;
    expect(col, e.id).toBeTruthy();
    // Du haut de la case du bord (sur la pente) jusqu'à la mer.
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeLessThanOrEqual(col.haut + 1 + 0.1);
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeGreaterThan(col.haut);
    // Jusque sous le niveau de la mer ; seules les deux connues des Îles du Ciel s'arrêtent sur la grève, au ras de l'eau
    // (relecture du code, GD-12) : une autre cascade qui s'arrêterait au-dessus de la mer se verrait.
    expect(Math.min(...pts.map((p) => p[1])), e.id).toBeLessThanOrEqual(CASCADES_SUR_LA_GREVE.includes(e.id) ? 0.1 : -0.3);
    // Collée à la falaise : jamais plus d'une case et demie de son bord.
    for (const p of pts) expect(Math.hypot(p[0] - (e.x + 0.5), p[2] - (e.y + 0.5)), e.id).toBeLessThan(1.75);
  }
});

it('tout le décor en un, deux ou trois appels de dessin (avec ses lueurs, ses fumées), en moins de triangles que ses cubes', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { maillage, elements, sol } = monde(a);
    const cout = coutDuDecor(maillage);
    expect(cout.drawCalls, a).toBeGreaterThanOrEqual(1);
    expect(cout.drawCalls, a).toBeLessThanOrEqual(3);
    const cubes = elements.flatMap((e) => e.cubes);
    const avant = faceCount(buildMesh(cubes, sol)) * 2;
    // Aux Îles du Ciel, depuis que les îles ont grandi (GD-11, 8 octobre 2026), il reste peu de décor (des rochers, le
    // grand phare) : ses 4 720 triangles passent les 3 804 de ses cubes, sous les 5 000.
    expect(cout.triangles, a).toBeLessThan(a === '3e' ? Math.max(avant, 5000) : avant);
    // Aux Îles Brumeuses, 15 338 depuis le Fournil des partages et la Grotte des légendes (EMC et latin-grec de 5e : sacs
    // de farine, caisse, rocher de tuf ; 13 632 avant), dans l'enveloppe du décor du 5e (world/budget.ts).
    expect(cout.triangles, a).toBeLessThanOrEqual(a === '5e' ? 15_400 : 15_000);
    // Des couleurs finies, dans l'espace linéaire.
    for (const f of [maillage.decor, maillage.lueurs, maillage.fumees.facettes]) {
      expect(f.positions.length).toBe(f.elements.length * 9);
      // (Seul le fût du phare dépasse 1, peint plus clair que blanc ; il n'est pas encore posé dans le décor.)
      for (const v of f.colors) expect(v >= 0 && v <= ECLAT_DU_FUT * (1 + OMBRE_DU_FUT.eclat) * (1 + OMBRE_DU_FUT.chaleur)).toBe(true);
      for (const v of f.positions) expect(Number.isFinite(v)).toBe(true);
    }
  }
  // Ce qui brille : les lanternes et la lave des repères.
  expect(monde('4e').maillage.lueurs.elements.length).toBeGreaterThan(0);
  expect(monde('5e').maillage.lueurs.elements.length).toBe(0);
}, 30_000);

it('le décor d’une île fermée est délavé, le même d’un rendu à l’autre', () => {
  const ferme = ranger('6e', true);
  const ouvert = monde('6e');
  const cle = (e: ElementDeDecor) => e.id;
  const i = ferme.elements.findIndex((e) => e.muted && e.genre === 'arbre');
  expect(i).toBeGreaterThanOrEqual(0);
  const j = ouvert.elements.findIndex((e) => cle(e) === cle(ferme.elements[i]));
  const couleur = (m: typeof ferme.maillage, k: number) => {
    const t = m.decor.elements.indexOf(k);
    return [m.decor.colors[t * 9], m.decor.colors[t * 9 + 1], m.decor.colors[t * 9 + 2]];
  };
  const [r1, g1, b1] = couleur(ferme.maillage, i);
  const [r2, g2, b2] = couleur(ouvert.maillage, j);
  // Délavé : moins saturé (le vert ne domine plus autant).
  expect(g1 - Math.min(r1, b1)).toBeLessThan(g2 - Math.min(r2, b2));
  // Le même d'un rendu à l'autre.
  const again = maillageDuDecor('6e', ouvert.champ, ouvert.elements);
  expect(again.decor.positions).toEqual(ouvert.maillage.decor.positions);
  expect(again.decor.colors).toEqual(ouvert.maillage.decor.colors);
});

it('toucher le décor, c’est toucher la case où il pousse ; toucher le sol libéré, c’est toucher sa case', () => {
  const { champ, elements, maillage } = monde('6e');
  const i = elements.findIndex((e) => e.genre === 'arbre' && colonneEn(champ, e.x, e.y));
  const e = elements[i];
  const t = maillage.decor.elements.indexOf(i);
  const col = colonneEn(champ, e.x, e.y)!;
  expect(caseDuDecor(champ, maillage, false, t)).toEqual({ cell: { x: e.x, y: e.y, z: col.haut }, next: { x: e.x, y: e.y, z: col.haut + 1 } });
  // Au large, un écueil renvoie la case de l'eau.
  const k = elements.findIndex((q) => q.genre === 'ecueil');
  const u = caseDuDecor(champ, maillage, false, maillage.decor.elements.indexOf(k))!;
  expect(u.cell).toEqual({ x: elements[k].x, y: elements[k].y, z: elements[k].z - 1 });
  // Le sol sous le décor, touché sur sa pente, redonne sa case (pickCell) : toutes les cases libérées.
  for (const q of elements) {
    const c = colonneEn(champ, q.x, q.y);
    if (!c || c.fixe) continue;
    const h = hauteurDuSol(champ, q.x + 0.3, q.y + 0.6)!;
    const picked = pickCell(champ, { x: q.x + 0.3, y: h, z: q.y + 0.6 }, { x: 0, y: 1, z: 0 });
    expect(picked?.cell, q.id).toEqual({ x: q.x, y: q.y, z: c.haut });
  }
});

it('on marche sur le sol libéré : les pieds suivent la pente sous une fleur, jamais dedans ni au-dessus', () => {
  const { champ, elements } = monde('6e');
  // (Loin du rivage : au bord de l'eau, la côte descend plus d'un bloc sous l'itinéraire, qui garde alors sa hauteur.)
  const fleurs = elements.filter((e) => {
    const col = e.genre === 'fleur' ? colonneEn(champ, e.x, e.y) : undefined;
    return col && !col.fixe && !col.rivage.some(Boolean);
  });
  expect(fleurs.length).toBeGreaterThan(3);
  let pente = 0;
  for (const f of fleurs) {
    const col = colonneEn(champ, f.x, f.y)!;
    // L'itinéraire du bonhomme passe à la hauteur des cubes (le haut de la colonne + 1) ; ses pieds, sur la facette.
    for (const [u, v] of [
      [0.5, 0.5],
      [0.4, 0.6],
    ]) {
      const s = hauteurDuSol(champ, f.x + u, f.y + v)!;
      expect(piedsSur(champ, f.x + u, f.y + v, col.haut + 1)).toBeCloseTo(s, 5);
    }
    if (Math.max(...col.coins) - Math.min(...col.coins) > 0.2) pente++;
  }
  expect(pente).toBeGreaterThan(0);
});

it('sans le drapeau, rien ne change : le monde en cubes garde tout son décor', () => {
  // La vue 3D en blocs lit les cubes de worldCubes, que le rangement ne touche pas.
  const { cubes } = monde('6e');
  const copie: VoxelCube[] = cubes.map((c) => ({ ...c }));
  rangerLeDecor(cubes.filter((c) => !c.sol));
  expect(cubes).toEqual(copie);
});

/** Les triangles d'un élément : sommets et couleurs (sRGB 0..255). */
function triangles(m: ReturnType<typeof ranger>['maillage'], i: number) {
  const out: { p: [number, number, number][]; c: number[][]; n: number }[] = [];
  const f = m.decor;
  const srgb = (v: number) => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  for (let t = 0; t < f.elements.length; t++) {
    if (f.elements[t] !== i) continue;
    const p = [0, 1, 2].map((k) => [f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]] as [number, number, number]);
    const c = [0, 1, 2].map((k) => [0, 1, 2].map((j) => srgb(f.colors[t * 9 + k * 3 + j])));
    out.push({ p, c, n: f.normals[t * 9 + 1] });
  }
  return out;
}

it('les arbres : deux familles de verts (six sur dix clairs), trois tailles, chaque boule plus claire en haut qu’en bas', () => {
  const a = '6e';
  const { elements, maillage } = monde(a);
  const herbe = valeur(couleurDuSol(a, 'herbe').dessus);
  // Les familles, à 15 % d'écart de valeur au moins ; le haut d'une boule plus clair que l'herbe (la nuit aussi : la
  // lumière de la scène les assombrit de même), son bas nettement plus sombre.
  expect(FAMILLES[1].valeur / FAMILLES[0].valeur).toBeLessThanOrEqual(0.85);
  expect(FAMILLES[1].valeur * FEUILLAGE[1]).toBeGreaterThan(1.05);
  expect(TAILLES).toEqual([0.7, 1, 1.3]);
  const arbres = elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'arbre' && !e.muted);
  const clairs: number[] = [];
  const largeurs = new Set<number>();
  for (const { i } of arbres) {
    const feuilles = triangles(maillage, i).filter((t) => t.p.some((q) => q[1] > Math.min(...triangles(maillage, i).map((u) => u.p[0][1])) + 1.5));
    const pts = feuilles.flatMap((t) => t.p.map((q, k) => ({ y: q[1], v: valeur(t.c[k] as [number, number, number]), x: q[0] })));
    const haut = pts.reduce((p, q) => (q.y > p.y ? q : p));
    const bas = pts.reduce((p, q) => (q.y < p.y ? q : p));
    expect(haut.v / herbe).toBeGreaterThan(1.05);
    expect(bas.v / herbe).toBeLessThan(0.8);
    clairs.push(haut.v / herbe > FAMILLES[0].valeur * 1.1 ? 1 : 0);
    largeurs.add(Math.round((Math.max(...pts.map((q) => q.x)) - Math.min(...pts.map((q) => q.x))) * 2) / 2);
  }
  const part = clairs.reduce((s, v) => s + v, 0) / clairs.length;
  expect(part).toBeGreaterThan(0.45);
  expect(part).toBeLessThan(0.75);
  // Trois tailles : des couronnes étroites et larges (autour de 2,4 cases pour la taille de base).
  expect(Math.min(...largeurs)).toBeLessThan(2);
  expect(Math.max(...largeurs)).toBeGreaterThan(2.8);
});

it('le chêne géant montre moins de la moitié de son tronc ; les repères n’ont pas de dalle à leur pied', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { elements, maillage, champ } = monde(a);
    elements.forEach((e, i) => {
      if (!['grand-arbre', 'champignon-geant', 'aiguille-de-glace', 'haut-fourneau', 'tour-de-guet', 'grand-phare'].includes(e.genre)) return;
      const ts = triangles(maillage, i);
      let sol = Infinity;
      for (const u of [0.1, 0.5, 0.9]) for (const v of [0.1, 0.5, 0.9]) sol = Math.min(sol, hauteurDuSol(champ, e.x + u * e.emprise, e.y + v * e.emprise) ?? Infinity);
      // Rien de plat au ras de la pente : pas de dalle, le pied plonge dans le sol, jamais plus de 0,3 case au-dessus.
      for (const t of ts) if (t.n > 0.95 && Math.max(...t.p.map((q) => q[1])) < sol + 0.3) throw new Error(`${e.id} : une dalle au pied`);
      if (e.genre === 'grand-arbre') {
        const y0 = sol;
        const top = Math.max(...ts.flatMap((t) => t.p.map((q) => q[1])));
        // Le bas de la couronne : le plus bas des sommets verts.
        const verts = ts.filter((t) => t.c.every((c) => c[1] > c[0] * 1.15));
        const bas = Math.min(...verts.flatMap((t) => t.p.map((q) => q[1])));
        // (0,45 jusqu'à GD-11 ; 0,46 depuis que le cœur de la Forêt a 26 cases, sur sa côte amincie.)
        expect((bas - y0) / (top - y0), e.id).toBeLessThanOrEqual(0.47);
      }
    });
  }
});

it('la fumée : chaque volute plus grosse, dérivée sous le vent comme le carré de son rang, les dernières fondues', () => {
  expect(FUMEE).toEqual({ croissance: 0.35, fondu: 0.3, volutes: 3 });
  // Les volutes du volcan du fond (4e) : des icosaèdres de vingt facettes, dans le maillage des fumées (R4b-6e), dans
  // leur pose immobile du lot R4. Le fourneau de la Forge a les siennes, trois minces (R4b-4e).
  const f = monde('4e').maillage.fumees;
  expect(f.panaches.map((p) => p.n).sort()).toEqual([3, 5]);
  const p = f.panaches.findIndex((q) => q.n === 5);
  const volutes = Array.from({ length: 5 }, (_, k) => {
    const pts: [number, number, number][] = [];
    for (let t = 0; t < f.facettes.elements.length; t++) {
      const v = f.volutes[f.facettes.elements[t]];
      if (v.panache === p && v.k === k) for (let s = 0; s < 3; s++) pts.push([0, 1, 2].map((j) => f.facettes.positions[t * 9 + s * 3 + j]) as [number, number, number]);
    }
    expect(pts.length, `volute ${k}`).toBe(60);
    return pts;
  });
  const centres = volutes.map((pts) => [0, 1, 2].map((j) => pts.reduce((s, q) => s + q[j], 0) / pts.length));
  const tailles = volutes.map((pts) => Math.max(...pts.map((q) => q[0])) - Math.min(...pts.map((q) => q[0])));
  for (let k = 1; k < 5; k++) expect(tailles[k], `volute ${k}`).toBeGreaterThan(tailles[k - 1] * 0.9);
  expect(tailles[4] / tailles[0]).toBeGreaterThan(1.8);
  // La dérive : de plus en plus grande à chaque rang.
  const d = centres.map((c) => Math.hypot(c[0] - centres[0][0], c[2] - centres[0][2]));
  for (let k = 2; k < 5; k++) expect(d[k] - d[k - 1]).toBeGreaterThan(d[k - 1] - d[k - 2] - 0.05);
  for (let k = 1; k < 5; k++) expect(centres[k][1]).toBeGreaterThan(centres[k - 1][1]);
});

it('écueils et bancs : moins de 2 820 triangles aux Premiers Rivages ; les rochers de la Forge prennent sa roche, ou la pierre chaude sur le basalte', () => {
  const { elements, maillage } = monde('6e');
  const mer = new Set(elements.map((e, i) => (e.genre === 'ecueil' || e.genre === 'banc' ? i : -1)));
  let n = 0;
  for (const i of maillage.decor.elements) if (mer.has(i)) n++;
  // 2 645 depuis que la carte de départ est calée sur la grille (GD-9) : la mer, plus large, porte quelques écueils de plus.
  // 2 762 avec les deux îles d'histoire-géographie (HG-2) ; plafond relevé de 2 700 à 2 800 (mainteneur, 6 octobre 2026).
  // 2 781 avec les trois îles de sciences (SC-2), dans le même cadre.
  // 2 804 avec les formes des îles (GD-12) : les bornes de l'archipel bougent d'une case et la mer se resème ; plafond
  // relevé à 2 820 (mainteneur, 9 octobre 2026).
  expect(n).toBeLessThanOrEqual(2820);
  // Tous les écueils et les bancs sont là, un élément chacun.
  // (139 et 55 avant que le cœur de la Forêt passe à 20 et que ses voisines s'écartent, 01/10/2026 ; 54 bancs avant que
  // l'îlot de son Gardien glisse sur le côté ; 140 avant les bacs du port, GD-7, qui en écartent un ; 139 et 53 avant
  // que la carte de départ soit calée sur la grille, GD-9 : la mer, plus large, en porte quelques-uns de plus ; 152 et 53
  // avant les deux îles d'histoire-géographie, HG-2, qui élargissent la région ; 157 et 57 avant les trois îles de
  // sciences, SC-2, posées dans le même cadre, qui prennent leur place à la mer ; 153 et 68 avant que les îlots des Gardiens
  // quittent la mer, GD-11 : la rade devant chaque île reste sans écueil, mais les couloirs des liaisons de la carte de
  // départ changent, et les écueils avec eux ; 147 et 64 avant que les îles grandissent, GD-11, 8 octobre 2026 ; 148
  // et 63 avant que chaque île prenne sa forme, GD-12, que les colonnes de côté se rangent sur quatre rangs et le rang
  // du fond en quinconce ; 145 et 66 avant le trait des formes à sept cases et les plages aux coins ; 157 avant le
  // Préau des délégués, EMC-2, qui prend sa place à la mer, et 71 bancs.)
  expect(elements.filter((e) => e.genre === 'ecueil').length).toBe(155);
  expect(elements.filter((e) => e.genre === 'banc').length).toBe(69);
  // La Forge : ses rochers sur la roche ont la valeur de la roche (0,9 à 1,1 fois), pas le beige de la pierre ; sur le
  // basalte, celle de la pierre chaude (R4b-4e), pas le basalte.
  const forge = monde('4e');
  const rochers = forge.elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'rocher' && e.id.startsWith('maths-4e-powers/'));
  expect(rochers.length).toBeGreaterThan(5);
  // Le sol du lieu qui suit la goutte jusqu'à sa pointe (GD-12, `placeGround`) est celui du cœur.
  const solDuLieu = new Set(landscape(islandDef('maths-4e-powers')).filter((c) => c.placeGround).map((c) => `${c.x},${c.y}`));
  for (const { e, i } of rochers) {
    const col = colonneEn(forge.champ, e.x, e.y)!;
    const m = col.matieres[col.matieres.length - 1];
    if (['herbe', 'mousse', 'sable', 'neige', 'glace', 'terre'].includes(m)) continue;
    // Les jalons des marges (GD-11) et de la côte (GD-12), sur le sol du cœur (l'acier), gardent la pierre des jalons.
    if (inCore(islandDef('maths-4e-powers'), e.x, e.y) || solDuLieu.has(`${e.x},${e.y}`)) continue;
    const dessus = triangles(forge.maillage, i).filter((t) => t.n > 0.3);
    const v = Math.max(...dessus.flatMap((t) => t.c.map((c) => valeur(c as [number, number, number]))));
    const roche = valeur(m === 'basalte' ? eclaircir(hex(COULEURS_4E.pierreChaude), 1.14) : couleurDuSol('4e', 'roche').dessus);
    expect(v / roche, `${e.id} ${m}`).toBeLessThan(1.1 * 1.08 * 1.02);
  }
});

it('toucher une couronne qui surplombe une borne de la Forêt des sons redonne la borne ; sans rien dessous, le décor', async () => {
  const { cubeTags, groundTap, toucheRetenue } = await import('./scene');
  const { islandOrigin, questStations } = await import('./terrain');
  const { BIOMES } = await import('../biomes');
  const { cubes, champ } = monde('6e');
  const tags = cubeTags(cubes);
  const can = { quest: true, bridge: true, build: false, place: true };
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === 'french-6e-phonology'));
  // Le rayon de la vue d'une île (three/WorldCanvas.tsx, ISLAND_VIEW), vers la caméra, repère Three.
  const versCamera = [0.7, 0.9, -0.7];
  const l = Math.hypot(...versCamera);
  const dir = versCamera.map((v) => -v / l) as [number, number, number];
  /** Le rayon qui arrive au point `p`, depuis 40 blocs en arrière. */
  const rayon = (p: number[]) => ({ o: p.map((v, j) => v - dir[j] * 40), d: dir });
  const triangle = (o: number[], d: number[], a: number[], b: number[], c: number[]): number | null => {
    const e1 = [0, 1, 2].map((j) => b[j] - a[j]);
    const e2 = [0, 1, 2].map((j) => c[j] - a[j]);
    const pv = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * pv[0] + e1[1] * pv[1] + e1[2] * pv[2];
    if (Math.abs(det) < 1e-9) return null;
    const tv = [0, 1, 2].map((j) => o[j] - a[j]);
    const u = (tv[0] * pv[0] + tv[1] * pv[1] + tv[2] * pv[2]) / det;
    if (u < 0 || u > 1) return null;
    const qv = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]];
    const v = (d[0] * qv[0] + d[1] * qv[1] + d[2] * qv[2]) / det;
    if (v < 0 || u + v > 1) return null;
    const t = (e2[0] * qv[0] + e2[1] * qv[1] + e2[2] * qv[2]) / det;
    return t > 0 ? t : null;
  };
  const boite = (o: number[], d: number[], min: number[]): number | null => {
    let t0 = -Infinity;
    let t1 = Infinity;
    for (let j = 0; j < 3; j++) {
      const a = (min[j] - o[j]) / d[j];
      const b = (min[j] + 1 - o[j]) / d[j];
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    return t1 >= t0 && t0 > 0 ? t0 : null;
  };
  let vus = 0;
  for (const st of questStations('french-6e-phonology')) {
    const bx = ox + st.x;
    const by = oy + st.y;
    const borne = cubes.filter((c) => c.x === bx && c.y === by && c.quest);
    const haut = Math.max(...borne.map((c) => c.z));
    const col = colonneEn(champ, bx + 1, by - 1)!;
    // Un arbre de trois blocs sur la case voisine, côté caméra : sa couronne surplombe la borne.
    for (const graine of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const id = `foret/arbre@${bx + 1},${by - 1}${graine}`;
      const arbre: ElementDeDecor = {
        id,
        genre: 'arbre',
        cubes: [0, 1, 2].map((k) => ({ x: bx + 1, y: by - 1, z: col.haut + 1 + k, color: '#6b4a2e', texture: 'tronc', decor: id })),
        x: bx + 1,
        y: by - 1,
        z: col.haut + 1,
        emprise: 1,
        muted: false,
      };
      const m = maillageDuDecor('6e', champ, [arbre]);
      for (const [u, v] of [
        [0.5, 0.5],
        [0.3, 0.7],
        [0.7, 0.3],
      ]) {
        const p = [bx + u, haut + 1, by + v];
        const { o, d } = rayon(p);
        let tDecor: number | null = null;
        for (let t = 0; t < m.decor.elements.length; t++) {
          const q = (k: number) => [0, 1, 2].map((j) => m.decor.positions[t * 9 + k * 3 + j]);
          const h = triangle(o, d, q(0), q(1), q(2));
          if (h !== null && (tDecor === null || h < tDecor)) tDecor = h;
        }
        const tBorne = Math.min(...borne.map((c) => boite(o, d, [c.x, c.z, c.y]) ?? Infinity));
        if (tDecor === null || !(tDecor < tBorne)) continue;
        vus++;
        // Le feuillage est devant ; la borne, derrière, est une cible : elle gagne.
        const cellule = { x: bx, y: by, z: haut };
        const cible = groundTap('6e', { cell: cellule, next: { ...cellule, z: haut + 1 }, ground: { x: bx + u, y: by + v } }, tags, can).kind === 'quest';
        expect(cible).toBe(true);
        expect(toucheRetenue([{ decor: true, distance: tDecor, cible: false }, { decor: false, distance: tBorne, cible }])).toBe(1);
      }
    }
  }
  expect(vus).toBeGreaterThan(0);
  // Rien de touchable derrière : le décor ; devant une cible, le plus proche ; une créature derrière le décor gagne.
  expect(toucheRetenue([{ decor: true, distance: 3, cible: false }, { decor: false, distance: 5, cible: false }])).toBe(0);
  expect(toucheRetenue([{ decor: false, distance: 3, cible: false }, { decor: true, distance: 1, cible: false }])).toBe(1);
  expect(toucheRetenue([{ decor: false, distance: 5, cible: true }, { decor: false, distance: 3, cible: false }])).toBe(1);
  expect(toucheRetenue([{ decor: true, distance: 2, cible: false }, { decor: false, distance: 6, cible: true }])).toBe(1);
  expect(toucheRetenue([])).toBe(-1);
});
