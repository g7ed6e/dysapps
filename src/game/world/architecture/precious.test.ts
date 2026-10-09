// Le métal, le précieux et le végétal du 6e (intention du directeur artistique, 9 octobre 2026) : la tôle et la tenture
// peintes (0 triangle), le lingot, le cristal et la cloche, le poteau de bois ; chaque pièce au plus aux triangles
// visibles du cube qu'elle remplace, et aucun appel de dessin de plus.
import type { VoxelCube } from '../cube';
import { BADGES } from '../../../core/progress';
import { trophyBlock } from '../../trophies';
import { toutConstruit, toutConstruitAvecLesCommandes } from '../budget';
import { batimentsDe, blocsDArchipeoDe, caseDeLaPiece, caseDuLieu, coursDe, coutDeLaConstruction, maillageDeLaConstruction, sansToursDuCoeur, TROPHEE } from '../construction';
import { rangerLeDecor } from '../decorMesh';
import { worldCubes } from '../terrain';
import { dockPosts } from '../harbor';
import { getArchipelago } from '../archipelago';
import { estUnePlaceDeTrophee } from '../trophyHall';
import { APPUI, architectureDe, PRECIEUX, cloche, cristal, lingot, MOTIF, MOTIF_FIN, MOTIF_GLSL, peintureDuMur, PIECES_BASSES, poteauDeBois, RANGEES, ROLES_PEINTS, TENTURE, TOLE, type Voisinage } from '.';
import { trianglesDe, type DessinDePiece } from './rooms';
import { KIT_6E } from './kits/6e';

const vois = (v: Partial<Voisinage>): Voisinage => ({
  texture: 'aimant',
  classe: 'mur',
  cotes: 0,
  dessus: 'rien',
  dessous: 'rien',
  monte: 0,
  descend: 0,
  coins: 0,
  toits: 0,
  surLeVide: false,
  ...v,
});
const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

/** Les points d'une pièce restent dans sa case, et chaque facette regarde vers le dehors (loin du centre de la pièce). */
function dansSaCaseEtTourneeAuDehors(d: DessinDePiece) {
  const pts = d.facettes.flatMap((f) => f.points);
  const centre = [0, 1, 2].map((i) => pts.reduce((n, p) => n + p[i], 0) / pts.length);
  for (const f of d.facettes) {
    for (const p of f.points) for (const v of p) expect(v >= 0 && v <= 1).toBe(true);
    const m = [0, 1, 2].map((i) => f.points.reduce((n, p) => n + p[i], 0) / f.points.length);
    expect(f.normale.reduce((n, v, i) => n + v * (m[i] - centre[i]), 0)).toBeGreaterThan(0);
  }
}

describe('La tôle et la tenture, peintes', () => {
  it('le bit vertical est à part : ni dans le genre, ni dans les rangées, sous les blocs assemblés', () => {
    expect(MOTIF.vertical & 3).toBe(0);
    expect(MOTIF.vertical).toBeLessThan(1 << RANGEES.pied);
    expect(MOTIF.vertical).toBeGreaterThan(MOTIF.rangees);
    expect(1 << (RANGEES.tete + 4)).toBe(MOTIF_FIN);
    // Un flottant 32 bits garde l'entier exact (l'attribut `motif`).
    expect(MOTIF_FIN).toBeLessThan(1 << 24);
  });

  it('la tôle : des joints verticaux, le soubassement à partir de trois rangées, un chaperon mince sans toit, aucun dessus gris ; aux pignons aussi', () => {
    const haut = peintureDuMur(vois({ dessous: 'mur' }), 'tole', { rangees: 3 });
    expect(haut.fond).toBe('tole');
    expect(haut.motifs.slice(0, 4)).toEqual(Array(4).fill(MOTIF.bardage | MOTIF.vertical | MOTIF.chaperon));
    expect(haut.motifs[4]).toBe(0);
    expect(peintureDuMur(vois({ dessus: 'mur' }), 'tole', { rangees: 3 }).motifs[0]).toBe(MOTIF.bardage | MOTIF.vertical | MOTIF.soubassement);
    expect(peintureDuMur(vois({ dessus: 'mur' }), 'tole', { rangees: 2 }).motifs[0]).toBe(MOTIF.bardage | MOTIF.vertical);
    // Un pignon (sous un toit, entre deux toits) reste en tôle, sans chaperon ; un volume lissé n'en a jamais.
    expect(peintureDuMur(vois({ dessus: 'toit', toits: 0b0101, dessous: 'mur' }), 'tole').motifs[0]).toBe(MOTIF.bardage | MOTIF.vertical);
    expect(peintureDuMur(vois({ dessous: 'mur' }), 'tole', { lisse: true }).motifs[0]).toBe(MOTIF.bardage | MOTIF.vertical);
  });

  it('la tenture : des plis sur toute la hauteur, le galon en haut du mur, ni soubassement ni chaperon de pierre', () => {
    expect(peintureDuMur(vois({ texture: 'velours', dessus: 'mur' }), 'tenture').motifs.slice(0, 4)).toEqual(Array(4).fill(MOTIF.plein | MOTIF.vertical));
    const haut = peintureDuMur(vois({ texture: 'velours', dessus: 'toit', dessous: 'mur' }), 'tenture');
    expect(haut.fond).toBe('matiere');
    expect(haut.motifs.slice(0, 4)).toEqual(Array(4).fill(MOTIF.plein | MOTIF.vertical | MOTIF.chaperon));
    expect(haut.motifs[4]).toBe(0);
  });

  it('le shader peint les joints, les plis et le galon, avec les rôles joint et galon du kit ; de loin, ils s’effacent', () => {
    expect(ROLES_PEINTS).toEqual(['poteau', 'soubassement', 'chaperon', 'joint', 'galon']);
    expect(MOTIF_GLSL).toContain(`uniform vec3 uRoles[${ROLES_PEINTS.length * 2}]`);
    expect(MOTIF_GLSL).toContain('vec3 galon = delave ? uRoles[9] : uRoles[4];');
    expect(MOTIF_GLSL).toContain(`fract(u / ${TOLE.pas.toFixed(4)})`);
    expect(MOTIF_GLSL).toContain('c = mix(c, joint, j * loin);');
    expect(MOTIF_GLSL).toContain(`${TENTURE.pli.toFixed(4)}`);
    expect(MOTIF_GLSL).toContain('c = mix(c, galon,');
    // Zinc clair, joints plus sombres, galon d'or (directeur artistique) ; la tôle n'est plus le gris de la pierre.
    expect([KIT_6E.couleurs.tole, KIT_6E.couleurs.joint, KIT_6E.couleurs.galon]).toEqual([0xa4aab0, 0x7e848a, 0xcca22e]);
  });
});

describe('Le précieux et le poteau de bois : au plus les triangles d’un cube', () => {
  it('le lingot, la cloche : des troncs de pyramide (10 triangles) ; le cristal : un prisme et sa pointe (12)', () => {
    expect(trianglesDe(lingot())).toBe(10);
    expect(trianglesDe(cloche())).toBe(10);
    expect(trianglesDe(cristal())).toBe(12);
    // Les proportions du directeur artistique : le lingot bas, ~0,8 × 0,5 à la base ; la cloche ~0,45 de haut, ~0,8 en bas.
    expect(PRECIEUX.lingot.base).toEqual([0.8, 0.5]);
    expect(PRECIEUX.lingot.haut).toBeLessThan(PRECIEUX.lingot.base[1]);
    expect([PRECIEUX.cloche.hauteur, PRECIEUX.cloche.bas]).toEqual([0.45, 0.8]);
    expect(PRECIEUX.cloche.dessus).toBeLessThan(PRECIEUX.cloche.bas);
    for (const d of [lingot(), cloche(), cristal()]) dansSaCaseEtTourneeAuDehors(d);
    // Les appuis du trophée du dessus : le haut du lingot, celui du prisme du cristal.
    expect(APPUI.lingot).toBeLessThan(TROPHEE.hauteur);
    expect(APPUI.cristal).toBeLessThan(TROPHEE.hauteur);
  });

  it('le poteau de bois : 0,3 case de section, le brun des pilotis, sans dessous ; sans dessus sous un poteau ou une lanterne', () => {
    expect(PIECES_BASSES.poteauDeBois).toBe(0.3);
    expect(trianglesDe(poteauDeBois(true))).toBe(10);
    expect(trianglesDe(poteauDeBois(false))).toBe(8);
    expect(poteauDeBois(true).facettes.every((f) => f.role === 'pilotis')).toBe(true);
    dansSaCaseEtTourneeAuDehors(poteauDeBois(true));
  });
});

describe('Au 6e, dans le monde', () => {
  const { progress, world: village } = toutConstruitAvecLesCommandes();
  // Comme le rendu d'Archipéo les range : sans le sol ni le décor en primitives, ni les tours du cœur.
  const cubes = sansToursDuCoeur(rangerLeDecor(worldCubes('6e', progress, village, false, [], false, 'halle').filter((c) => !c.sol)).reste);
  const archi = architectureDe('6e', cubes, { batiments: batimentsDe('6e'), cours: coursDe('6e'), toitures: blocsDArchipeoDe('6e'), caseDuLieu });

  it('l’aimant devient tôle : le laboratoire de Bulle (pignons et jardinières compris), l’étagère, l’établi, l’escalier de Grimoire', () => {
    // Hors les bornes (le socle d'une borne prend la matière de son île : il est dessiné en pilier).
    const aimants = cubes.filter((c) => c.texture === 'aimant' && !c.ghost && !c.quest);
    expect(aimants.length).toBeGreaterThan(30);
    for (const c of aimants) expect(archi.peints.get(cle(c))?.peinture.fond, cle(c)).toBe('tole');
    expect(new Set(aimants.filter((c) => c.petiteConstruction).map((c) => c.tag))).toEqual(new Set(['physics-chemistry-6e-matter-energy', 'technology-6e-objects', 'french-6e-reading']));
    // Les marches de l'escalier de Grimoire restent des pièces du kit.
    const marches = cubes.filter((c) => c.petiteConstruction && c.tag === 'french-6e-reading' && c.texture === 'escalier');
    for (const c of marches) expect(archi.remplacees.has(cle(c))).toBe(true);
  });

  it('les poteaux des liaisons et de la jetée deviennent des poteaux de bois, pas le tronc du décor du cœur', () => {
    const port = getArchipelago('6e').port;
    const jetee = new Set(dockPosts(port).map((p) => `${p.x},${p.y}`));
    const poteaux = archi.pieces.filter((p) => p.famille === 'vegetal');
    expect(poteaux.length).toBeGreaterThan(10);
    for (const p of poteaux) expect(p.cube.texture === 'tronc' && (Boolean(p.cube.bridge) || (p.cube.tag === port && jetee.has(`${p.cube.x},${p.cube.y}`))), cle(p.cube)).toBe(true);
    expect(poteaux.some((p) => !p.cube.bridge)).toBe(true);
    for (const c of cubes.filter((c) => c.texture === 'tronc' && !c.ghost && !c.decor && (c.bridge || (c.tag === port && jetee.has(`${c.x},${c.y}`))))) expect(archi.remplacees.has(cle(c)), cle(c)).toBe(true);
  });

  it('le toucher d’un poteau de bois prend sa case', () => {
    const ile = archi.pieces.find((p) => p.famille === 'vegetal')!.cube.tag;
    const lesCubes = cubes.filter((c) => c.tag === ile);
    const m = maillageDeLaConstruction('6e', lesCubes);
    const poteau = architectureDe('6e', lesCubes, { batiments: batimentsDe('6e'), cours: coursDe('6e'), toitures: blocsDArchipeoDe('6e'), caseDuLieu }).pieces.find((p) => p.famille === 'vegetal')!;
    // Le milieu de sa face −y (repère Three : x, hauteur, y).
    const p = { x: poteau.cube.x + 0.5, y: poteau.cube.z + 0.5, z: poteau.cube.y + 0.35 };
    const tranche = m.pieces![0];
    let touche: ReturnType<typeof caseDeLaPiece> = null;
    for (let t = tranche.opaque[0]; t < tranche.opaque[1] && !touche; t++) {
      const i = 6 * (t - tranche.opaque[0]);
      if (tranche.cases[i] === poteau.cube.x && tranche.cases[i + 1] === poteau.cube.y && tranche.cases[i + 2] === poteau.cube.z) touche = caseDeLaPiece(m, 'opaque', t, p, { x: 0, y: 0, z: -1 });
    }
    expect(touche?.cell).toEqual({ x: poteau.cube.x, y: poteau.cube.y, z: poteau.cube.z });
  });

  it('la salle des trophées pleine : les trophées d’or en lingots, de cristal en cristaux, au plus les 10 triangles d’un cube, aucun appel de plus', () => {
    const trophees = BADGES.map((b) => trophyBlock(b.id));
    const { progress: p0, world: v0 } = toutConstruit();
    const salle = worldCubes('6e', p0, v0, false, trophees).filter((c) => c.place === 'trophies');
    const places = salle.filter((c) => {
      const m = caseDuLieu(c);
      return m && estUnePlaceDeTrophee(m.x, m.y, m.z);
    });
    expect(places.some((c) => c.texture === 'or') && places.some((c) => c.texture === 'cristal')).toBe(true);
    const m = maillageDeLaConstruction('6e', salle);
    const sansPrecieux = maillageDeLaConstruction('6e', salle.map((c): VoxelCube => (places.includes(c) && (c.texture === 'or' || c.texture === 'cristal') ? { ...c, texture: 'quartz' } : c)));
    const or = places.filter((c) => c.texture === 'or').length;
    const cr = places.filter((c) => c.texture === 'cristal').length;
    // Une boîte : 8 triangles (sans dessous ni fond) ; un lingot 8, un cristal 9 (sans leurs faces du fond).
    expect(coutDeLaConstruction(m).opaque - coutDeLaConstruction(sansPrecieux).opaque).toBe(or * (8 - 8) + cr * (9 - 8));
    expect(coutDeLaConstruction(m).drawCalls).toBe(coutDeLaConstruction(sansPrecieux).drawCalls);
  });
});
