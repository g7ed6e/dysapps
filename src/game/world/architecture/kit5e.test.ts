// Le kit des Collines du Large (5e, ./kits/5e.ts ; intention du directeur artistique du 9 octobre 2026) : les pièces
// nouvelles du reste (l'auvent, la planche du panneau, la plate-bande, la congère, la marche), l'écart au fantôme (le
// point dys : la glace, le sel, la toile, les congères), la tuile lue par sa place, les murs de toile, de bambou et de
// pierre grise, le kiosque, l'école et la salle des trophées.
import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { batimentsDe, caseDuLieu, coursDe, etapesDe, maillageDeLaConstruction } from '../construction';
import { couleurDuRole } from '../construction/settings';
import { BRUME, couleurDeMatiere } from '../palette';
import { worldCubes } from '../terrain';
import { restOf } from './heart';
import { apartFromGhost, awning, crate, darkPost, HEART, mound, paddyBed, rgbGap, signBoard, slab, snowDrift } from './heartPieces';
import { stepOf } from './lowPieces';
import { HEART_MOTIFS, MOTIF } from './paint';
import { trianglesDe, type DessinDePiece } from './rooms';
import { architectureDe, KITS } from '.';
import type { RestContext, RestDrawing } from './kits';

const KIT = KITS['5e'];
const cube = (x: number, y: number, z: number, texture?: string, extra: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#3b2d20', ...(texture ? { texture } : {}), tag: 'ile', ...extra }) as VoxelCube;
const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

/** Le reste d'un petit monde de cubes, au cœur d'une île. */
function monde(cubes: VoxelCube[], origin: RestContext['origin'] = 'coeur'): (c: VoxelCube) => RestDrawing | undefined {
  const par = new Map(cubes.map((c) => [cle(c), c]));
  return (c) => restOf(c, { origin, at: (x, y, z) => par.get(`${x},${y},${z}`), place: null });
}

const pieceOf = (d: RestDrawing | undefined): DessinDePiece => {
  if (!d || !('piece' in d)) throw new Error('pas une pièce');
  return d.piece;
};

/** Une couleur linéaire de Three.js (0 à 1) ramenée en sRGB (0 à 255), pour mesurer son écart au fantôme. */
const srgb = (v: number) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));

describe('Le kit du 5e : les pièces du reste', () => {
  it('chaque pièce nouvelle coûte au plus un cube (10 triangles) et tient dans sa case', () => {
    for (const [nom, d] of [
      ['auvent', awning()],
      ['planche le long de x', signBoard(true)],
      ['planche le long de y', signBoard(false)],
      ['plate-bande', paddyBed()],
      ['congère', snowDrift()],
      ['poteau de tourbe', darkPost(true)],
    ] as const) {
      expect(trianglesDe(d), nom).toBeLessThanOrEqual(10);
      for (const f of d.facettes) for (const p of f.points) for (const v of p) expect(v >= -1e-9 && v <= 1 + 1e-9, nom).toBe(true);
    }
    // L'auvent : une nappe de 0,25 en haut de sa case ; la planche : 0,15 d'épaisseur ; la plate-bande : 0,3.
    expect(Math.min(...awning().facettes.flatMap((f) => f.points.map((p) => p[2])))).toBeCloseTo(1 - HEART.awning);
    const ys = signBoard(true).facettes.flatMap((f) => f.points.map((p) => p[1]));
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(HEART.signBoard.thick);
    expect(Math.max(...paddyBed().facettes.flatMap((f) => f.points.map((p) => p[2])))).toBeCloseTo(HEART.paddy);
  });

  it('le décor du cœur : auvents, ballots, panneau indicateur, tour de lambris et son chapeau, thermomètre, congères, tas de sel, dalles, rizière, escalier', () => {
    // Les auvents : une nappe mince quand une voisine les prolonge ; seuls au sol, un ballot.
    const auvent = [cube(0, 0, 3, 'toile'), cube(1, 0, 3, 'toile')];
    expect(pieceOf(monde(auvent)(auvent[0]))).toBe(awning());
    expect(pieceOf(monde([cube(0, 0, 1, 'toile')])(cube(0, 0, 1, 'toile')))).toEqual(crate(MOTIF.plein | MOTIF.vertical, false, false));
    expect(pieceOf(monde([cube(0, 0, 1, 'tuile')])(cube(0, 0, 1, 'tuile')))).toEqual(crate(MOTIF.bardage, false, false));
    // Le panneau contre un poteau de bois : une planche le long de lui ; posé au sol, une caisse bardée.
    const poteau = [cube(1, 0, 1, 'tronc'), cube(1, 0, 2, 'tronc'), cube(0, 0, 2, 'panneau'), cube(1, 1, 2, 'panneau')];
    expect(pieceOf(monde(poteau)(poteau[2]))).toBe(signBoard(true));
    expect(pieceOf(monde(poteau)(poteau[3]))).toBe(signBoard(false));
    expect(pieceOf(monde([cube(5, 5, 1, 'panneau')])(cube(5, 5, 1, 'panneau')))).toEqual(crate(MOTIF.bardage, false, false));
    // La tour de lambris du Manoir : bardée comme la cabine ; son chapeau sombre, de toute sa case sous la bougie.
    const tour = [cube(0, 0, 1, 'lambris'), cube(0, 0, 2, 'lambris'), cube(0, 0, 3), cube(0, 0, 4, 'lanterne')];
    const t = monde(tour);
    expect(t(tour[0])).toMatchObject({ family: 'bardage', paint: { motifs: [MOTIF.bardage, MOTIF.bardage, MOTIF.bardage, MOTIF.bardage, 0, 0] } });
    expect(t(tour[2])).toMatchObject({ family: 'bardage', paint: { fond: 'matiere' } });
    // Le thermomètre : la glace en pilier lissé, le verre posé sur elle en verrière (pas une mare).
    const thermometre = [cube(0, 0, 1, 'glace'), cube(0, 0, 2, 'glace'), cube(0, 0, 3, 'verre'), cube(0, 0, 4, 'chaume')];
    const th = monde(thermometre);
    expect(th(thermometre[0])).toMatchObject({ family: 'pierre', paint: { fond: 'matiere' } });
    expect(th(thermometre[2])).toMatchObject({ family: 'verre', paint: { motifs: [HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, HEART_MOTIFS.glazing, 0, 0] } });
    // Une flaque au sol reste une mare.
    expect(monde([cube(0, 0, 1, 'verre')])(cube(0, 0, 1, 'verre'))).toMatchObject({ family: 'eau' });
    // La congère, le tas de sel (ce qui porte un sel en pilier, le sommet en tas bas), le rocher à strates.
    expect(pieceOf(monde([cube(0, 0, 1, 'nuage')])(cube(0, 0, 1, 'nuage')))).toBe(snowDrift());
    const sel = [cube(0, 0, 1, 'sel'), cube(0, 0, 2, 'sel'), cube(1, 0, 1, 'sel')];
    expect(monde(sel)(sel[0])).toMatchObject({ family: 'pierre', paint: { fond: 'matiere' } });
    expect(pieceOf(monde(sel)(sel[1]))).toEqual(mound());
    expect(pieceOf(monde(sel)(sel[2]))).toEqual(mound());
    expect(monde([cube(0, 0, 1, 'strate')])(cube(0, 0, 1, 'strate'))).toMatchObject({ family: 'pierre', paint: { fond: 'matiere' } });
    // Le montoir de dalles, le plateau d'enluminure sur son pied de planches (une caisse qui le porte), la rizière.
    expect(pieceOf(monde([cube(0, 0, 1, 'dalle')])(cube(0, 0, 1, 'dalle')))).toEqual(slab(HEART.slab.mounting));
    const pupitre = [cube(0, 0, 1, 'planches'), cube(0, 0, 2, 'enluminure')];
    expect(pieceOf(monde(pupitre)(pupitre[1]))).toEqual(slab(HEART.slab.desk));
    expect(pieceOf(monde(pupitre)(pupitre[0]))).toEqual(crate(MOTIF.bardage, true, false));
    expect(pieceOf(monde([cube(0, 0, 1, 'riziere')])(cube(0, 0, 1, 'riziere')))).toBe(paddyBed());
    // L'escalier : une marche basse ; sous une autre, toute la case.
    const echelle = [cube(0, 0, 1, 'escalier'), cube(0, 0, 2, 'escalier')];
    expect(pieceOf(monde(echelle)(echelle[0]))).toBe(stepOf(true));
    expect(pieceOf(monde(echelle)(echelle[1]))).toBe(stepOf(false));
  });

  it('dans une petite construction, une tuile qui couvre (le couvercle de la glacière) est un toit plat, peint', () => {
    const glaciere = [cube(0, 0, 1, 'glace'), cube(1, 0, 1, 'glace'), cube(0, 0, 2, 'tuile'), cube(1, 0, 2, 'tuile')];
    expect(monde(glaciere, 'petite')(glaciere[2])).toMatchObject({ family: 'toit', paint: { fond: 'matiere' } });
  });
});

describe('Le kit du 5e : l’écart au fantôme (référent dys)', () => {
  it('le sel, le dessus de la toile et la congère seraient trop près du fantôme Brume : le kit les en tient à 70 au moins', () => {
    const gap = HEART.chalk.ghostGap;
    // Sans la règle : le dessus du sel et de la toile sont à moins de 70 du fantôme.
    expect(rgbGap(couleurDeMatiere('5e', 'sel').dessus, BRUME)).toBeLessThan(gap);
    expect(rgbGap(couleurDeMatiere('5e', 'toile').dessus, BRUME)).toBeLessThan(gap);
    // La glace bâtie prend la glace du sol du 5e (#A6BAC2), assez loin d'elle-même.
    for (const f of ['dessus', 'cote'] as const) expect(rgbGap(couleurDeMatiere('5e', 'glace')[f], BRUME), f).toBeGreaterThanOrEqual(gap);
    expect(KIT.ghostApart).toEqual(['glace', 'sel', 'toile']);
    // La congère : dans la neige du kit (#B3C1C7), tenue à l'écart.
    expect(KIT.couleurs.snow).toBe(0xb3c1c7);
    expect(snowDrift().facettes.every((f) => f.role === 'snow' && f.ghostApart)).toBe(true);
    expect(rgbGap(apartFromGhost(couleurDuRole('5e', KIT, 'snow')), BRUME)).toBeGreaterThanOrEqual(gap);
  });

  it('dans la construction du 5e, chaque face de glace, de sel et de toile (murs, volumes lissés, pièces) est à 70 au moins du fantôme', () => {
    const cubes = [
      cube(0, 0, 1, 'sel', { petiteConstruction: true }),
      cube(0, 0, 2, 'sel', { petiteConstruction: true }),
      cube(3, 0, 1, 'toile', { petiteConstruction: true }),
      cube(6, 0, 1, 'glace', { petiteConstruction: true }),
      cube(9, 0, 1, 'toile'),
    ];
    const m = maillageDeLaConstruction('5e', cubes, [], { kit: KIT });
    const c = m.opaque.colors;
    expect(c.length).toBeGreaterThan(0);
    for (let i = 0; i < c.length; i += 3) {
      const hex = (srgb(c[i]) << 16) | (srgb(c[i + 1]) << 8) | srgb(c[i + 2]);
      // L'arrondi d'aller et retour en linéaire : un point de marge.
      expect(rgbGap(hex, BRUME), hex.toString(16)).toBeGreaterThanOrEqual(HEART.chalk.ghostGap - 1);
    }
  });
});

describe('Le kit du 5e : les murs, les lieux, le kiosque', () => {
  const { progress, world: village } = toutConstruit();
  const tous = worldCubes('5e', progress, village, false, [], false, 'halle').filter((c) => !c.sol && !c.decor);
  const archi = architectureDe('5e', tous, { batiments: batimentsDe('5e'), cours: coursDe('5e'), caseDuLieu });

  it('l’échoppe du Comptoir : ses tuiles des murs en mur plein (de la famille de la pierre), son auvent rayé peint à plat ; celle du Marché en toile tendue, sans galon', () => {
    const murs = etapesDe('5e', 0, 1);
    const toits = etapesDe('5e', 1, 2);
    const comptoir = tous.filter((c) => c.tag === 'english-5e-vocabulary' && !c.place && !c.petiteConstruction && !c.ghost);
    const tuilesDesMurs = comptoir.filter((c) => c.texture === 'tuile' && murs.has(cle(c)));
    expect(tuilesDesMurs.length).toBeGreaterThan(0);
    for (const c of tuilesDesMurs) {
      const p = archi.peints.get(cle(c));
      expect(p?.famille, cle(c)).toBe('pierre');
      expect(p!.peinture.motifs.slice(0, 4).every((f) => (f & 3) === MOTIF.plein)).toBe(true);
    }
    for (const tag of ['english-5e-vocabulary', 'maths-5e-proportionality']) {
      const auvent = tous.filter((c) => c.tag === tag && !c.place && !c.petiteConstruction && !c.ghost && toits.has(cle(c)) && c.texture !== 'lanterne');
      expect(auvent.length, tag).toBeGreaterThan(0);
      for (const c of auvent) expect(archi.peints.get(cle(c))?.peinture.motifs, cle(c)).toEqual([0, 0, 0, 0, 0, 0]);
    }
    const toile = tous.filter((c) => c.tag === 'maths-5e-proportionality' && c.texture === 'toile' && murs.has(cle(c)) && !c.ghost);
    expect(toile.length).toBeGreaterThan(0);
    for (const c of toile) for (const f of archi.peints.get(cle(c))!.peinture.motifs.slice(0, 4)) expect(f).toBe(MOTIF.plein | MOTIF.vertical);
  });

  it('le bambou de la Menuiserie en clins verticaux ; la rizière des murs du Delta en colombage, celle de sa cour en plate-bande', () => {
    const bambou = tous.filter((c) => c.texture === 'bambou' && !c.ghost && batimentsDe('5e').has(cle(c)));
    expect(bambou.length).toBeGreaterThan(0);
    for (const c of bambou) expect(archi.peints.get(cle(c))!.peinture.motifs[0] & (MOTIF.vertical | 3)).toBe(MOTIF.vertical | MOTIF.bardage);
    const riziere = tous.filter((c) => c.texture === 'riziere' && !c.ghost);
    expect(riziere.filter((c) => batimentsDe('5e').has(cle(c))).every((c) => archi.peints.get(cle(c))?.famille === 'colombage')).toBe(true);
    const cour = riziere.filter((c) => coursDe('5e').has(cle(c)));
    expect(cour.length).toBeGreaterThan(0);
    for (const c of cour) expect(archi.pieces.find((p) => p.cube === c)?.dessin).toBe(paddyBed());
  });

  it('l’école et les piliers de la salle des trophées en mur plein de pierre grise #7D8A86 ; la Halle en colombage, comme au 6e', () => {
    expect(KIT.couleurs.masonry).toBe(0x7d8a86);
    const ecole = tous.filter((c) => c.place === 'school' && (c.texture === 'brique' || c.texture === 'taille') && (caseDuLieu(c)?.z ?? 9) <= 3);
    expect(ecole.length).toBeGreaterThan(0);
    for (const c of ecole) expect(archi.peints.get(cle(c))?.peinture.fond, cle(c)).toBe('masonry');
    const piliers = [...archi.peints.values()].filter((p) => p.cube.place === 'trophies' && p.cube.texture === 'marbre' && p.peinture.fond === 'masonry');
    expect(piliers.length).toBeGreaterThan(0);
    const halle = [...archi.peints.values()].filter((p) => p.cube.place === 'assembly' && p.famille === 'colombage');
    expect(halle.length).toBeGreaterThan(0);
  });

  it('le kiosque : ses poteaux de tourbe en poteaux carrés, son toit en damier peint à plat, son lanterneau en verrière', () => {
    const kiosque = tous.filter((c) => c.place === 'monument:landmark-5e-2' && !c.ghost);
    const poteaux = kiosque.filter((c) => c.texture === 'tourbe');
    expect(poteaux.length).toBe(24);
    for (const c of poteaux) expect(archi.pieces.some((p) => p.cube === c && p.facettes.length > 0), cle(c)).toBe(true);
    for (const c of kiosque.filter((x) => x.texture === 'toile' || x.texture === 'tuile')) expect(archi.peints.get(cle(c))?.peinture.motifs).toEqual([0, 0, 0, 0, 0, 0]);
    for (const c of kiosque.filter((x) => x.texture === 'vitrail')) expect(archi.peints.get(cle(c))?.peinture.motifs[0]).toBe(HEART_MOTIFS.glazing);
  });
});
