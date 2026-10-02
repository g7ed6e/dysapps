// Les formes des Anciens Ateliers (sous-lot R4b-4e ; intention : docs/univers/archipeo/intentions/4e-anciens-ateliers.md).
import { toutConstruit } from '../budget';
import { caseDuDecor, maillageDuDecor, rangerLeDecor, type MaillageDuDecor } from '../decorMesh';
import { getArchipelago } from '../archipelago';
import { dockBox } from '../harbour';
import { champDuSol, colonneEn, NIVEAU_EAU } from '../landMesh';
import { CORE, MAP } from '../map';
import { PLAN_ZONE } from '../plans';
import { worldBounds, worldCubes } from '../terrain';
import { CONTREFORT, COULEURS_4E, cratereDuVolcan, ECUEIL_BAS, FOURNEAU, GRUE, LOINTAIN_4E, VOLCAN_DU_FOND } from './4e';
import { BORNES_DU_LOINTAIN } from './lointain';
import { hex } from './pinceau';

function ranger(muted = false) {
  const { progress, village } = toutConstruit();
  const cubes = worldCubes('4e', progress, village, false).map((c) => (muted && !c.sol ? { ...c, muted: true } : c));
  const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
  const champ = champDuSol(
    '4e',
    cubes.filter((c) => c.sol),
    reste,
  );
  return { cubes, champ, poses: elements, maillage: maillageDuDecor('4e', champ, elements) };
}
const monde = ranger();

/** Les sommets des triangles d'un élément, dans le décor ou dans les lueurs. */
function sommets(m: MaillageDuDecor, i: number, lueurs = false): [number, number, number][] {
  const f = lueurs ? m.lueurs : m.decor;
  const out: [number, number, number][] = [];
  for (let t = 0; t < f.elements.length; t++) if (f.elements[t] === i) for (let k = 0; k < 3; k++) out.push([f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]]);
  return out;
}
const indice = (genre: string) => monde.maillage.elements.findIndex((e) => e.genre === genre);

it('le fourneau de la Forge couvre les quatre cases du haut-fourneau de Blocland et reste plus bas que lui', () => {
  const i = indice('haut-fourneau');
  const e = monde.maillage.elements[i];
  expect(e.emprise).toBe(2);
  const pts = sommets(monde.maillage, i);
  // Chaque case de l'emprise a des sommets au-dessus d'elle : rien ne bloque le bonhomme sans se voir (règle 1).
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ])
    expect(pts.some(([x, , z]) => x >= e.x + dx && x <= e.x + dx + 1 && z >= e.y + dy && z <= e.y + dy + 1), `${dx},${dy}`).toBe(true);
  // Cinq cases de haut (lèvre comprise), au lieu des dix du haut-fourneau.
  expect(Math.max(...pts.map((p) => p[1])) - e.z).toBeLessThanOrEqual(FOURNEAU.hauteur + 0.2);
  // Trois volutes minces.
  expect(monde.maillage.fumees.panaches.filter((p) => p.n === FOURNEAU.fumee.volutes)).toHaveLength(1);
});

it('la gueule du fourneau rougeoie dans les lueurs, et reste éteinte tant que la Forge est fermée', () => {
  const gueule = hex(COULEURS_4E.gueule);
  const i = indice('haut-fourneau');
  expect(sommets(monde.maillage, i, true).length).toBeGreaterThan(0);
  const ferme = ranger(true);
  const j = ferme.maillage.elements.findIndex((e) => e.genre === 'haut-fourneau');
  expect(sommets(ferme.maillage, j, true)).toHaveLength(0);
  expect(gueule).toBe(0xe8662c);
});

it('les écueils d’ardoise sont bas : une case au plus au-dessus de l’eau', () => {
  const ardoise = monde.maillage.elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'ecueil' && e.cubes.some((c) => c.texture === 'ardoise' && c.z >= 0));
  expect(ardoise.length).toBeGreaterThan(5);
  for (const { i } of ardoise) expect(Math.max(...sommets(monde.maillage, i).map((p) => p[1]))).toBeLessThanOrEqual(NIVEAU_EAU + ECUEIL_BAS.haut + 1e-6);
});

it('la grue est hors de la grille, sur la terre de l’Atelier, hors du cœur, du quai et des autres décors, et ne se touche pas', () => {
  const i = indice('grue');
  const g = monde.maillage.elements[i];
  expect(g.horsGrille).toBe(true);
  expect(g.cubes).toHaveLength(0);
  const def = MAP.find((d) => d.id === GRUE.ile)!;
  const col = colonneEn(monde.champ, g.x, g.y);
  expect(col?.ile).toBe('atelier');
  const dansLeCoeur = g.x >= def.core.x && g.x < def.core.x + CORE && g.y >= def.core.y && g.y < def.core.y + CORE;
  expect(dansLeCoeur).toBe(false);
  // Sur le flanc droit (−x) du cœur (décision du directeur artistique, 28/09).
  expect(g.x).toBeLessThan(def.core.x);
  for (const e of monde.poses) expect(Math.max(Math.abs(e.x - g.x), Math.abs(e.y - g.y)), e.id).toBeGreaterThan(1);
  // Hors du quai de l'archipel et de ses abords.
  const quai = dockBox(getArchipelago('4e').port);
  expect(g.x < quai.x0 - 2 || g.x > quai.x1 + 2 || g.y < quai.y0 - 2 || g.y > quai.y1 + 2).toBe(true);
  // Le toucher ne la retrouve pas.
  const t = monde.maillage.decor.elements.indexOf(i);
  expect(caseDuDecor(monde.champ, monde.maillage, false, t)).toBeNull();
});

it('la grue garde sa case à toute étape de la partie, hors du cœur', () => {
  const g = monde.maillage.elements[indice('grue')];
  const vierge = worldCubes('4e', {}, { plans: {}, journal: [], bridges: [] }, false);
  const { elements, reste } = rangerLeDecor(vierge.filter((c) => !c.sol));
  const champ = champDuSol(
    '4e',
    vierge.filter((c) => c.sol),
    reste,
  );
  const v = maillageDuDecor('4e', champ, elements).elements.find((e) => e.genre === 'grue')!;
  expect([v.x, v.y]).toEqual([g.x, g.y]);
});

it('la grue : 9 cases de haut, une flèche de 6 cases à 0,7 de sa hauteur, vers la zone des plans, en 150 triangles au plus', () => {
  const i = indice('grue');
  const g = monde.maillage.elements[i];
  const pts = sommets(monde.maillage, i);
  expect(pts.length / 3).toBeLessThanOrEqual(150);
  const haut = Math.max(...pts.map((p) => p[1]));
  expect(haut - g.z).toBeGreaterThan(GRUE.hauteur - 0.2);
  expect(haut - g.z).toBeLessThan(GRUE.hauteur + 1);
  // Le point le plus loin du mât est le bout de la flèche : à 6 cases, du côté de la zone des plans (+x).
  const def = MAP.find((d) => d.id === GRUE.ile)!;
  const [cx, cz] = [g.x + 0.5, g.y + 0.5];
  const bout = pts.reduce((p, q) => (Math.hypot(q[0] - cx, q[2] - cz) > Math.hypot(p[0] - cx, p[2] - cz) ? q : p));
  expect(Math.hypot(bout[0] - cx, bout[2] - cz)).toBeCloseTo(GRUE.fleche, 0);
  expect(bout[0]).toBeGreaterThan(cx);
  expect(Math.abs(bout[0] - (def.core.x + PLAN_ZONE.x))).toBeLessThan(Math.abs(cx - (def.core.x + PLAN_ZONE.x)));
});

it('le volcan du fond : un cône du lointain derrière le bout droit de la crête, son panache de cinq volutes au cratère', () => {
  expect(LOINTAIN_4E.pieces).toContain(VOLCAN_DU_FOND);
  expect(VOLCAN_DU_FOND.u).toBeLessThan(0.2);
  expect(VOLCAN_DU_FOND.recul).toBeGreaterThanOrEqual(80);
  expect(VOLCAN_DU_FOND.recul).toBeLessThanOrEqual(120);
  expect(VOLCAN_DU_FOND.haut).toBeGreaterThanOrEqual(15);
  expect(VOLCAN_DU_FOND.haut).toBeLessThanOrEqual(18);
  expect(VOLCAN_DU_FOND.pans).toBe(9);
  for (const p of LOINTAIN_4E.pieces) {
    expect(p.recul).toBeGreaterThanOrEqual(BORNES_DU_LOINTAIN.recul[0]);
    expect(p.recul).toBeLessThanOrEqual(BORNES_DU_LOINTAIN.recul[1]);
    expect(p.haut).toBeGreaterThanOrEqual(BORNES_DU_LOINTAIN.haut[0]);
    expect(p.haut).toBeLessThanOrEqual(BORNES_DU_LOINTAIN.haut[1]);
  }
  const f = monde.maillage.fumees;
  const p = f.panaches.find((q) => q.n === 5)!;
  const c = cratereDuVolcan(worldBounds('4e'));
  expect(p.chemin[0][0]).toBeCloseTo(c.x, 1);
  expect(p.chemin[0][2]).toBeCloseTo(c.y, 1);
  expect(p.chemin[0][1]).toBeGreaterThan(c.z);
  // Pas de lueur au cratère : le lointain n'est que dans le décor.
  expect(monde.maillage.lueurs.elements.every((e) => e >= 0)).toBe(true);
});

it('le ponton du Jardin des heures (LV2) : sur son rivage est, au ras de l’eau, sa barque amarrée ; aucune verticale au-dessus du sol', () => {
  const i = indice('ponton');
  expect(i).toBeGreaterThanOrEqual(0);
  const e = monde.maillage.elements[i];
  const jardin = MAP.find((d) => d.id === 'jardin')!;
  // Sur une case de terre du Jardin, à l'est du cœur ; de l'eau devant.
  expect(colonneEn(monde.champ, e.x, e.y)?.ile).toBe('jardin');
  expect(e.x).toBeGreaterThanOrEqual(jardin.core.x + CORE);
  const devant = colonneEn(monde.champ, e.x + 1, e.y);
  expect(devant === undefined || devant.ile !== 'jardin' || devant.liquide).toBe(true);
  // Ses cubes de Blocland : l'échelle, le tablier et la barque, dans l'archipel.
  const b = worldBounds('4e');
  for (const c of e.cubes) expect(c.x).toBeLessThan(b.maxX);
  // En Archipéo : du bord de l'eau au haut de la falaise, rien plus haut qu'un demi-bloc au-dessus du sol (ni mât, ni
  // girouette : la grue reste la seule verticale du 4e) ; la barque, sous le tablier, sur l'eau.
  const pts = sommets(monde.maillage, i);
  const sol = colonneEn(monde.champ, e.x, e.y)!.haut + 1;
  expect(Math.max(...pts.map((p) => p[1]))).toBeLessThanOrEqual(sol + 0.5);
  expect(Math.min(...pts.map((p) => p[1]))).toBeLessThan(NIVEAU_EAU);
  // (La barque, à deux cases du rivage, au large du contrefort de pierre qui porte l'échelle.)
  const barque = pts.filter((p) => p[0] > e.x + 1.5 && p[2] > e.y + 0.5 + 0.7);
  expect(barque.length).toBeGreaterThan(0);
  for (const p of barque) expect(p[1]).toBeLessThanOrEqual(NIVEAU_EAU + 0.35);
  // L'échelle s'appuie sur un contrefort de pierre, de l'eau jusque sous le rivage, juste derrière elle (côté île).
  // Il prend la roche de la falaise, s'élargit vers le pied, et s'arrête une marche sous le bord de l'herbe.
  const face = e.x + 0.5 + CONTREFORT.face;
  const contrefort = pts.filter((p) => p[0] <= face + 1e-3 && p[0] >= e.x + 0.5 - CONTREFORT.recul[1] - 0.2 && p[1] > NIVEAU_EAU - 0.35 && p[1] < sol - 0.5);
  expect(Math.min(...contrefort.map((p) => p[1]))).toBeLessThan(NIVEAU_EAU);
  const haut = Math.max(...contrefort.map((p) => p[1]));
  expect(haut).toBeGreaterThan(sol - 2.01);
  expect(haut).toBeLessThanOrEqual(sol - 1 + 1e-6);
  expect(CONTREFORT.pied).toBeGreaterThan(CONTREFORT.haut);
});
