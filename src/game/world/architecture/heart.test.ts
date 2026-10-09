// Le reste du 6e (./heart.ts, ./heartPieces.ts) : chaque objet du cœur, du quai, des liaisons et des lieux a son dessin,
// au coût d'un cube ou moins pour ce qui est fait de main d'homme, dans sa case.
import type { VoxelCube } from '../cube';
import { restOf6e } from './heart';
import { apartFromGhost, bead, crate, deck, dialSlab, foliage, mound, pavilion, rgbGap, rock, slab, spire, trunk, waterSheet, wheat, chalkLoaf, cap, beam, darkPost, hangingCrate, HEART, coneSide, coneCorner } from './heartPieces';
import { facettesPosees, trianglesDe, type DessinDePiece } from './rooms';
import { assemblerLesPieces } from './assembly';
import { BRUME } from '../palette';
import { HEART_MOTIFS, HEART_PAINT, MOTIF } from './paint';
import type { RestContext, RestDrawing } from './kits';

const cube = (x: number, y: number, z: number, texture?: string, extra: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#3b2d20', ...(texture ? { texture } : {}), tag: 'ile', ...extra }) as VoxelCube;

/** Le contexte d'un petit monde de cubes. */
function monde(cubes: VoxelCube[], origin: RestContext['origin'] = 'coeur'): (c: VoxelCube) => RestDrawing | undefined {
  const par = new Map(cubes.map((c) => [`${c.x},${c.y},${c.z}`, c]));
  return (c) => restOf6e(c, { origin, at: (x, y, z) => par.get(`${x},${y},${z}`), place: null });
}

const pieceOf = (d: RestDrawing | undefined): DessinDePiece => {
  if (!d || !('piece' in d)) throw new Error('pas une pièce');
  return d.piece;
};

describe('Les pièces du cœur (./heartPieces.ts)', () => {
  it('ce qui est fait de main d’homme coûte au plus un cube (10 triangles), le pavillon et la flèche 4', () => {
    for (const [nom, d] of [
      ['caisse', crate(MOTIF.bardage, false, false)],
      ['perle', bead()],
      ['dalle', dialSlab()],
      ['mosaïque', slab(HEART.slab.mosaic)],
      ['tas', mound()],
      ['blé', wheat()],
      ['craie', chalkLoaf()],
      ['chaperon', cap()],
      ['poteau sombre', darkPost(true)],
    ] as const)
      expect(trianglesDe(d), nom).toBeLessThanOrEqual(10);
    expect(trianglesDe(pavilion())).toBe(4);
    expect(trianglesDe(spire())).toBe(4);
    // Le tablier et la caisse suspendue : une boîte entière (on les voit d'en bas).
    expect(trianglesDe(deck(true))).toBe(12);
    expect(trianglesDe(hangingCrate())).toBe(12);
    expect(trianglesDe(beam(false))).toBe(12);
  });

  it('rien ne sort de sa case (le toucher prend toute la case)', () => {
    const pieces = [coneSide(), coneCorner(), crate(MOTIF.bardage, true, true), bead(), dialSlab(), mound(), wheat(), chalkLoaf(), cap(), pavilion(), spire(), deck(false), beam(true), hangingCrate(), waterSheet(0.8, 0, true), rock('a', false), rock('b', true), trunk(), foliage('c', false), foliage('d', true)];
    for (const d of pieces)
      for (const f of d.facettes)
        for (const p of f.points) for (const v of p) expect(v).toBeGreaterThanOrEqual(-1e-9), expect(v).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('le tablier : un plancher mince en haut de la case, qui file le long de la marche, ses joints en travers', () => {
    const d = deck(true);
    expect(d.filant).toBe(true);
    expect(Math.min(...d.facettes.flatMap((f) => f.points.map((p) => p[2])))).toBe(HEART.deck);
    const dessus = d.facettes.find((f) => f.normale[2] > 0)!;
    expect([dessus.role, dessus.motif]).toEqual(['bardage', HEART_MOTIFS.planksAlongX]);
    expect(deck(false).facettes.find((f) => f.normale[2] > 0)!.motif).toBe(HEART_MOTIFS.planksAlongY);
    expect(d.facettes.filter((f) => f.normale[2] <= 0).every((f) => f.role === 'pilotis')).toBe(true);
    // Le même dessin d'une case à l'autre : la rangée se dessine d'un tenant (./assembly.ts).
    expect(deck(true)).toBe(d);
  });

  it('l’eau en nappe : un dessus plat, son liseré en bandes au bord de la nappe seulement, ses flancs sombres hors de la margelle', () => {
    const seule = waterSheet(0.8, 0, false);
    const dessus = seule.facettes.filter((f) => f.normale[2] > 0);
    expect(dessus.map((f) => f.role)).toEqual(['nappe', 'lisere', 'lisere', 'lisere', 'lisere']);
    // Rien n'est peint par le shader sur la nappe (le liseré peint débordait d'une case sur l'autre : des tirets).
    expect(dessus.every((f) => !f.motif)).toBe(true);
    expect(seule.facettes.filter((f) => f.role === 'flanc')).toHaveLength(4);
    // Une voisine d'eau à l'est : pas de liseré de ce côté, la nappe va jusqu'au bord ; partout, une seule hauteur.
    const est = waterSheet(0.8, 1, false).facettes.filter((f) => f.normale[2] > 0);
    expect(est.filter((f) => f.role === 'lisere')).toHaveLength(3);
    expect(Math.max(...est[0].points.map((p) => p[0]))).toBe(1);
    expect(est.filter((f) => f.role === 'lisere').every((f) => f.points.every((p) => p[0] < 1 || p[1] < HEART_PAINT.lisere + 1e-9 || p[1] > 1 - HEART_PAINT.lisere - 1e-9))).toBe(true);
    expect(new Set(est.flatMap((f) => f.points.map((p) => p[2])))).toEqual(new Set([0.8]));
    // Entourée d'eau : la nappe seule, de bord à bord.
    expect(waterSheet(0.8, 0b1111, false).facettes.filter((f) => f.role === 'lisere')).toHaveLength(0);
    // Une margelle tout autour : aucun flanc.
    expect(waterSheet(0.8, 0, false, 0b1111).facettes.filter((f) => f.role === 'flanc')).toHaveLength(0);
    expect(waterSheet(0.8, 0, true, 0b1111).facettes.filter((f) => f.role === 'feuille').length).toBeGreaterThan(0);
  });

  it('ce qui pousse reprend les primitives du décor, dans la teinte de sa matière', () => {
    expect(trianglesDe(rock('x', false))).toBe(20);
    expect(trianglesDe(trunk())).toBe(10);
    expect(trianglesDe(foliage('x', true))).toBe(20);
    // Le même dessin, fait une fois (une reconstruction ne refait ni le pinceau ni l'icosaèdre).
    expect(rock('x', false)).toBe(rock('x', false));
    expect(foliage('x', true)).toBe(foliage('x', true));
    expect(rock('x', false)).not.toBe(rock('x', true));
    expect(rock('x', false).facettes.every((f) => f.role === undefined)).toBe(true);
  });
});

describe('Le reste du 6e (./heart.ts)', () => {
  it('la tour d’horloge : le pilier lissé, le cadran peint, la flèche d’or ; le rouage en dalles', () => {
    const tour = [1, 2, 3].map((z) => cube(0, 0, z, 'pierre'));
    const cadran = cube(0, 0, 4, 'cadran');
    const fleche = cube(0, 0, 5, 'or');
    const rouage = cube(5, 5, 1, 'cadran');
    const r = monde([...tour, cadran, fleche, rouage]);
    expect(r(tour[0])).toMatchObject({ paint: { fond: 'matiere' } });
    const peint = r(cadran);
    expect(peint && 'paint' in peint && peint.paint.motifs.slice(0, 4).every((m) => (m & MOTIF.cadran) !== 0)).toBe(true);
    expect(pieceOf(r(fleche))).toEqual(spire());
    expect(pieceOf(r(rouage))).toEqual(dialSlab());
  });

  it('le Gardien : un socle à chaperon, un bloc d’or mat à chaperon ; le cône des Décimaux : braise mate au sommet', () => {
    const socle = cube(0, 0, 1, 'pierre');
    const or = cube(0, 0, 2, 'or');
    const r = monde([socle, or]);
    expect(r(socle)).toMatchObject({ paint: { motifs: [MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.pierreEntiere, 0] } });
    expect(r(or)).toMatchObject({ paint: { fond: 'galon' } });
    // Deux pierres et de l'or, sans la forme du cône : la braise peinte sur la case.
    const pile = [cube(5, 5, 1, 'pierre'), cube(5, 5, 2, 'pierre'), cube(5, 5, 3, 'or')];
    expect(monde(pile)(pile[2])).toMatchObject({ paint: { fond: 'braise' } });
  });

  it('le cône des Décimaux : une jupe en pans et croupes, une cheminée qui se resserre, la braise sur le seul dessus du sommet', () => {
    const jupe = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => cube(10 + dx, 10 + dy, 1, 'pierre')));
    const colonne = cube(10, 10, 2, 'pierre');
    const sommet = cube(10, 10, 3, 'or');
    const r = monde([...jupe, colonne, sommet]);
    const coeur = jupe[4];
    expect(r(coeur)).toMatchObject({ paint: { fond: 'matiere' } });
    expect(r(cube(11, 10, 1, 'pierre'))).toEqual({ family: 'pierre', piece: coneSide(), rotation: 0 });
    expect(r(cube(10, 9, 1, 'pierre'))).toEqual({ family: 'pierre', piece: coneSide(), rotation: 3 });
    expect(r(cube(9, 11, 1, 'pierre'))).toEqual({ family: 'pierre', piece: coneCorner(), rotation: 1 });
    // Assemblée autour du cœur (plein) : les bouts des pans et des coins se touchent et disparaissent, 2 triangles par case.
    const pieces = jupe
      .filter((c) => c !== coeur)
      .map((c) => {
        const d = r(c) as { piece: DessinDePiece; rotation: number };
        return { cube: c, piece: 'jupe', rotation: d.rotation, dessin: d.piece, facettes: facettesPosees(d.piece, d.rotation, c.x, c.y, c.z) };
      });
    const vues = assemblerLesPieces(pieces, (x, y, z) => x === 10 && y === 10 && z === 1, () => '');
    expect(vues.reduce((n, v) => n + v.facette.points.length - 2, 0)).toBe(16);
    expect(vues.every((v) => v.facette.normale[2] > 0)).toBe(true);
    // La cheminée : de la case entière à la largeur du sommet, sans dessus sous la braise.
    const col = pieceOf(r(colonne));
    expect(col.facettes.every((f) => f.normale[2] < 0.99)).toBe(true);
    const haut = pieceOf(r(sommet));
    const largeur = (d: DessinDePiece, z: number) => d.facettes.flatMap((f) => f.points).reduce((w, p) => (Math.abs(p[2] - z) < 1e-9 ? Math.max(w, 2 * Math.abs(p[0] - 0.5)) : w), 0);
    expect(largeur(col, 0)).toBeCloseTo(1);
    expect(largeur(haut, 0)).toBeCloseTo(largeur(col, 1));
    expect(largeur(haut, HEART.cone.ember)).toBeCloseTo(HEART.cone.top);
    expect(haut.facettes.filter((f) => f.role === 'braise').map((f) => f.normale)).toEqual([[0, 0, 1]]);
    expect(haut.facettes.filter((f) => f.role !== 'braise').every((f) => f.colourBelow && f.normale[2] < 0.99)).toBe(true);
    // Au plus 34 triangles pour tout le cône (jupe 16, cheminée 8, sommet 10).
    expect(trianglesDe(col) + trianglesDe(haut)).toBeLessThanOrEqual(18);
  });

  it('les pierres posées là (isolées, en amas), les galets et l’obsidienne : des rochers', () => {
    const amas = [cube(0, 0, 1, 'pierre'), cube(1, 0, 1, 'pierre'), cube(0, 0, 2, 'pierre')];
    const r = monde([...amas, cube(9, 9, 1, 'galet')]);
    for (const c of amas) expect(trianglesDe(pieceOf(r(c)))).toBe(20);
    expect(trianglesDe(pieceOf(r(cube(9, 9, 1, 'galet'))))).toBe(20);
  });

  it('le boulier : des perles séparées ; la borne de brique : un pilier ; la dune : lissée ; le tas : un tronc de pyramide', () => {
    const rangee = [0, 1, 2, 3, 4].map((x) => cube(x, 0, 1, x < 3 ? 'brique' : 'sable'));
    const borne = [cube(10, 10, 1, 'brique'), cube(10, 10, 2, 'brique')];
    const dune = [0, 1, 2].flatMap((x) => [0, 1, 2].map((y) => cube(20 + x, 20 + y, 1, 'sable')));
    const tas = cube(30, 30, 1, 'sable');
    const r = monde([...rangee, ...borne, ...dune, tas]);
    for (const c of rangee) expect(pieceOf(r(c))).toEqual(bead());
    expect(r(borne[0])).toMatchObject({ paint: { fond: 'matiere' } });
    for (const c of dune) expect(r(c)).toHaveProperty('paint');
    expect(pieceOf(r(tas))).toEqual(mound());
  });

  it('la cabine bardée et son chaperon brun, le réverbère, la galerie de la Mine, les caisses', () => {
    const cabine = [1, 2, 3].map((z) => cube(0, 0, z, 'cabine'));
    const dessus = cube(0, 0, 4);
    const reverbere = [1, 2, 3].map((z) => cube(5, 0, z));
    const lanterne = cube(5, 0, 4, 'lanterne');
    const galerie = [0, 1].flatMap((x) => [1, 2].map((z) => cube(10 + x, 0, z)));
    const carton = [cube(20, 0, 1, 'carton'), cube(20, 0, 2, 'carton')];
    const r = monde([...cabine, dessus, ...reverbere, lanterne, ...galerie, ...carton]);
    expect(r(cabine[0])).toMatchObject({ paint: { motifs: [MOTIF.bardage, MOTIF.bardage, MOTIF.bardage, MOTIF.bardage, 0, 0] } });
    expect(pieceOf(r(dessus))).toEqual(cap());
    expect(pieceOf(r(reverbere[2]))).toEqual(darkPost(false));
    // L'encadrement de la galerie, sur la face vue (−y), au bord du volume seulement.
    const bas = r(galerie[0]);
    expect(bas && 'paint' in bas && bas.paint.motifs[3]).toBe(HEART_MOTIFS.gallery | MOTIF.montante);
    const haut = r(galerie[3]);
    expect(haut && 'paint' in haut && haut.paint.motifs[3]).toBe(HEART_MOTIFS.gallery | MOTIF.descendante | MOTIF.chaperon);
    // Deux cartons l'un sur l'autre : deux caisses, celle du dessus plus étroite.
    expect(pieceOf(r(carton[0]))).toEqual(crate(MOTIF.bardage, true, false));
    expect(pieceOf(r(carton[1]))).toEqual(crate(MOTIF.bardage, false, true));
  });

  it('le petit arbre, le buisson, le nénuphar porté par la mare, les poteaux de barrière', () => {
    const arbre = [cube(0, 0, 1, 'tronc'), cube(0, 0, 2, 'tronc'), cube(0, 0, 3, 'feuilles')];
    const mare = [cube(5, 5, 1, 'verre'), cube(6, 5, 1, 'verre')];
    const nenuphar = cube(5, 5, 2, 'feuilles');
    const poteau = cube(9, 9, 1, 'tronc');
    const r = monde([...arbre, ...mare, nenuphar, poteau]);
    expect(pieceOf(r(arbre[0]))).toEqual(trunk());
    expect(trianglesDe(pieceOf(r(arbre[2])))).toBe(20);
    expect(trianglesDe(pieceOf(r(nenuphar)))).toBe(0);
    expect(pieceOf(r(mare[0])).facettes.some((f) => f.role === 'feuille')).toBe(true);
    // La mare de deux cases : une seule nappe, pas de liseré entre elles (côté +x de la première), posée à 0,05.
    const premiere = pieceOf(r(mare[0])).facettes.filter((f) => f.role === 'lisere');
    expect(premiere.some((f) => f.points.every((p) => p[0] > 0.5))).toBe(false);
    expect(pieceOf(r(mare[0])).facettes[0].points[0][2]).toBe(HEART.water.pond);
    expect(HEART.water.pond).toBeLessThanOrEqual(0.05);
    expect(trianglesDe(pieceOf(r(poteau)))).toBeLessThanOrEqual(10);
  });

  it('la jetée et les liaisons : le tablier le long de la marche ; le bouchon d’un poteau : le poteau continue', () => {
    const jetee = [0, 1, 2].map((y) => cube(0, y, 0, 'planches'));
    const r = monde(jetee);
    expect(r(jetee[1])).toEqual({ family: 'vegetal', piece: deck(false), rotation: 0 });
    const pont = [0, 1, 2].map((x) => cube(x, 0, 0, 'planches', { bridge: 'a-b' }));
    expect(monde(pont, 'liaison')(pont[1])).toEqual({ family: 'vegetal', piece: deck(true), rotation: 1 });
    const bouchon = [cube(5, 5, 0, 'tronc'), cube(5, 5, 1, 'planches')];
    expect(trianglesDe(pieceOf(monde(bouchon)(bouchon[1])))).toBeLessThanOrEqual(10);
  });

  it('la craie (le Préau des délégués) : un pain de craie, si elle est posée au cœur, tenu à l’écart du fantôme', () => {
    expect(pieceOf(monde([cube(0, 0, 1, 'craie')])(cube(0, 0, 1, 'craie')))).toEqual(chalkLoaf());
    expect(chalkLoaf().facettes.every((f) => f.ghostApart)).toBe(true);
    // Une craie claire hypothétique (#EEEEE6, à 10 du fantôme Brume) : menée vers le gris jusqu'à 70 d'écart au moins.
    expect(rgbGap(0xeeeee6, BRUME)).toBeLessThan(HEART.chalk.ghostGap);
    expect(rgbGap(apartFromGhost(0xeeeee6), BRUME)).toBeGreaterThanOrEqual(HEART.chalk.ghostGap);
    // Le chaperon du dessus (plus sombre que les flancs, dans le shader) ne fait que s'en écarter davantage.
    expect(apartFromGhost(0xeeeee6)).not.toBe(0xeeeee6);
    // Une teinte déjà loin du fantôme ne change pas.
    expect(apartFromGhost(0x8a8f84)).toBe(0x8a8f84);
  });

  it('le champ de blé : ses flancs striés, jamais le motif du tablier sur son dessus (`straw` et `planksAlongY` sont le même nombre)', () => {
    expect(HEART_MOTIFS.straw).toBe(HEART_MOTIFS.planksAlongY);
    const dessus = wheat().facettes.filter((f) => f.normale[2] > 0);
    expect(dessus.length).toBeGreaterThan(0);
    expect(dessus.every((f) => (f.motif ?? 0) !== HEART_MOTIFS.straw)).toBe(true);
    expect(wheat().facettes.filter((f) => f.normale[2] === 0).every((f) => f.motif === HEART_MOTIFS.straw)).toBe(true);
  });

  it('les petites constructions : l’eau du puits sous la margelle, un pavillon seul, une rangée de toits peinte ; le verre hors d’un mur en verrière', () => {
    const puits = [cube(1, 1, 1, 'eau'), cube(0, 1, 1, 'brique'), cube(2, 1, 1, 'brique'), cube(1, 0, 1, 'brique'), cube(1, 2, 1, 'brique')];
    const r = monde(puits, 'petite');
    expect(pieceOf(r(puits[0]))).toEqual(waterSheet(HEART.water.level, 0, false, 0b1111));
    expect(pieceOf(r(cube(9, 9, 1, 'toit')))).toEqual(pavilion());
    const rangee = [0, 1, 2].map((x) => cube(20 + x, 0, 3, 'toit'));
    expect(monde(rangee, 'petite')(rangee[1])).toMatchObject({ family: 'toit', paint: { fond: 'matiere' } });
    expect(monde([cube(0, 0, 1, 'verre')], 'cour')(cube(0, 0, 1, 'verre'))).toMatchObject({ paint: { motifs: [HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, 0, 0] } });
    // Un toit caché sous un autre : son dessus n'est pas émis.
    expect(monde([cube(0, 0, 4, 'toit'), cube(0, 0, 5, 'toit')], 'batiment')(cube(0, 0, 4, 'toit'))).toMatchObject({ hiddenTop: true });
  });
});
