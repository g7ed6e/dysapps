import { toutConstruit } from '../budget';
import { caseDuDecor, rangerLeDecor, maillageDuDecor, type ElementDeDecor } from '../decorMesh';
import { champDuSol, colonneEn, NIVEAU_EAU } from '../landMesh';
import { ALTITUDE, inCore, islandDef } from '../map';
import { ambianceDe, luminance } from '../palette';
import { worldCubes } from '../terrain';
import { bancsDeBrume, COUCHES_5E, placeDeLaBrume } from './mist';
import { COULEURS_5E } from './5e';
import { MOUVEMENT_DE_LA_BRUME, respirationDeLaBrume } from './smoke';

const { progress, world: village } = toutConstruit();
const cubes = worldCubes('5e', progress, village, false);
const sol = cubes.filter((c) => c.sol);
const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
const champ = champDuSol('5e', sol, reste);
const m = maillageDuDecor('5e', champ, elements);

/** Les triangles d'un élément, projetés sur le sol : trois sommets (x, z) chacun. */
function triangles(i: number): [number, number][][] {
  const out: [number, number][][] = [];
  const f = m.decor;
  for (let t = 0; t < f.elements.length; t++)
    if (f.elements[t] === i)
      out.push([0, 1, 2].map((k) => [f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 2]] as [number, number]));
  return out;
}

/** Un point (x, z) est-il sous un des triangles ? */
function couvert(tris: [number, number][][], x: number, z: number): boolean {
  const signe = (p: [number, number], a: [number, number], b: [number, number]) => (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  return tris.some(([a, b, c]) => {
    const d1 = signe([x, z], a, b);
    const d2 = signe([x, z], b, c);
    const d3 = signe([x, z], c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  });
}

const repere = (genre: string): [ElementDeDecor, number] => {
  const i = elements.findIndex((e) => e.genre === genre);
  expect(i, genre).toBeGreaterThanOrEqual(0);
  return [elements[i], i];
};

it('un repère d’Archipéo couvre toutes les cases que bloque celui de Blocland (règle 1 du directeur artistique)', () => {
  for (const genre of ['champignon-geant', 'aiguille-de-glace']) {
    const [e, i] = repere(genre);
    const tris = triangles(i);
    const cases = new Set(e.cubes.map((c) => `${c.x},${c.y}`));
    for (const k of cases) {
      const [x, y] = k.split(',').map(Number);
      expect(couvert(tris, x + 0.5, y + 0.5), `${genre} : ${k}`).toBe(true);
    }
  }
});

it('les éboulis du Glacier ne dépassent pas 2,5 cases ; la tour d’archives du Marais dépasse les toits et penche', () => {
  const haut = (i: number) => {
    let h = -Infinity;
    const f = m.decor;
    for (let t = 0; t < f.elements.length; t++) if (f.elements[t] === i) for (let k = 0; k < 3; k++) h = Math.max(h, f.positions[t * 9 + k * 3 + 1]);
    return h;
  };
  const [aiguille, ia] = repere('aiguille-de-glace');
  const pied = Math.min(...aiguille.cubes.map((c) => c.z));
  expect(haut(ia) - pied).toBeLessThanOrEqual(2.5);
  const [marais, im] = repere('champignon-geant');
  const h = haut(im) - Math.min(...marais.cubes.map((c) => c.z));
  expect(h).toBeGreaterThan(5);
  expect(h).toBeLessThan(6.5);
});

it('la tour en ruine, la calotte, le ponton et la girouette du Relais sont hors de la grille : sans cubes, on ne les touche pas ; la calotte coiffe le plus haut pic du Glacier', () => {
  const hors = m.elements.filter((e) => e.horsGrille);
  expect(hors.map((e) => e.genre).sort()).toEqual(['calotte', 'girouette', 'ponton', 'tour-en-ruine']);
  for (const e of hors) {
    expect(e.cubes).toEqual([]);
    const i = m.elements.indexOf(e);
    const t = Array.from(m.decor.elements).indexOf(i);
    expect(t, e.genre).toBeGreaterThanOrEqual(0);
    expect(caseDuDecor(champ, m, false, t), e.genre).toBeNull();
  }
  // La calotte : le point le plus haut du Glacier en est couvert.
  let pic = champ.colonnes[0];
  for (const c of champ.colonnes) if (c.ile === 'maths-5e-signed-numbers' && (pic.ile !== 'maths-5e-signed-numbers' || c.haut > pic.haut)) pic = c;
  expect(couvert(triangles(m.elements.findIndex((e) => e.genre === 'calotte')), pic.x + 0.5, pic.y + 0.5)).toBe(true);
  // La tour en ruine, derrière le cœur du Carrefour, jamais dedans.
  const tour = hors.find((e) => e.genre === 'tour-en-ruine')!;
  expect(colonneEn(champ, tour.x, tour.y)?.ile).toBe('french-5e-homophones');
  expect(inCore(islandDef('french-5e-homophones'), tour.x, tour.y)).toBe(false);
  // Le ponton du Relais, sur son rivage est, hors du cœur ; la girouette juste derrière le cœur, derrière l'auberge.
  const relais = islandDef('lv2-5e-introductions');
  const ponton = hors.find((e) => e.genre === 'ponton')!;
  expect(colonneEn(champ, ponton.x, ponton.y)?.ile).toBe('lv2-5e-introductions');
  expect(ponton.x).toBeGreaterThanOrEqual(relais.core.x + 16);
  expect(colonneEn(champ, ponton.x + 1, ponton.y)?.ile === 'lv2-5e-introductions' && !colonneEn(champ, ponton.x + 1, ponton.y)?.liquide).toBe(false);
  const girouette = hors.find((e) => e.genre === 'girouette')!;
  expect(colonneEn(champ, girouette.x, girouette.y)?.ile).toBe('lv2-5e-introductions');
  expect(girouette.y - relais.core.y).toBeGreaterThanOrEqual(16);
  expect(girouette.y - relais.core.y).toBeLessThanOrEqual(17);
  expect(Math.abs(girouette.x - relais.core.x - 9.5)).toBeLessThanOrEqual(3);
  // La neige du sol se peint en roche claire : jamais aussi claire que la glace de la calotte.
  expect(luminance(COULEURS_5E.glace)).toBeGreaterThan(luminance(ambianceDe('5e').sols!.neige!.dessus));
});

it('les bancs de brume : jamais sur un ouvrage, le quai ni la route du navire ; toujours sous le sol des îles, qui les cache', () => {
  const b = bancsDeBrume('5e', [])!;
  const place = placeDeLaBrume('5e', []);
  for (let v = 0; v < b.positions.length / 3; v++) {
    const [x, y, z] = [b.positions[v * 3], b.positions[v * 3 + 1], b.positions[v * 3 + 2]];
    expect(y).toBeLessThan(ALTITUDE['5e']);
    expect(y).toBeGreaterThan(NIVEAU_EAU);
    // Un sommet visible (d'opacité non nulle) est à sa place ; au pied d'une île, il passe sous son sol.
    if (b.colors[v * 4 + 3] > 0) {
      expect(place(x, z), `${x},${z}`).toBe(true);
      const col = colonneEn(champ, Math.floor(x), Math.floor(z));
      if (col) expect(y + 0.5, `${x},${z}`).toBeLessThan(col.haut);
    }
  }
  // La couche du bas à 0,6 d'opacité au plus, respiration comprise ; de `#C5D9EB` en bas à `#E5EBE3` en haut.
  expect(COUCHES_5E[0].opacite * (1 + MOUVEMENT_DE_LA_BRUME.opacite)).toBeLessThanOrEqual(0.6);
  expect(COUCHES_5E.map((c) => c.hauteur)).toEqual([...COUCHES_5E.map((c) => c.hauteur)].sort((p, q) => p - q));
  expect([COUCHES_5E[0].couleur, COUCHES_5E.at(-1)!.couleur]).toEqual([0xc5d9eb, 0xe5ebe3]);
});

it('seules les Îles Brumeuses ont des bancs de brume ; ils respirent, et « Réduire les animations » les fige d’un coup', () => {
  expect(bancsDeBrume('6e', [])).toBeNull();
  expect(respirationDeLaBrume(0, 3, false)).not.toEqual(respirationDeLaBrume(0, 7, false));
  expect(respirationDeLaBrume(0, 3, true)).toEqual(respirationDeLaBrume(0, 7, true));
});
