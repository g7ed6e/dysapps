// Les murs peints du lot 7b : le colombage, le bardage, le soubassement, le chaperon, et la règle dys des décharges
// (aucun motif qui ressemble à une lettre : ni croix, ni chevron, ni losange ; au plus une décharge par panneau).
import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { batimentsDe } from '../construction';
import { worldCubes } from '../terrain';
import { architectureDe, COLOMBAGE, decharge, indexDuPlan, MOTIF, MOTIF_GLSL, peintureDuMur, sensDeLaDecharge, voisinageDe, type Voisinage } from '.';

const vois = (v: Partial<Voisinage>): Voisinage => ({
  texture: 'planches',
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
const dehors = () => true;
const aDesDecharges = (m: number) => Boolean(m & (MOTIF.montante | MOTIF.descendante));

describe('Les murs peints', () => {
  it('le colombage : soubassement et sablière basse au pied, sablière haute sous un toit, chaperon de pierre sans rien au-dessus', () => {
    const pied = peintureDuMur(vois({ cotes: 0b0101, dessus: 'mur' }), 'colombage', { exterieur: dehors });
    expect(pied.fond).toBe('remplissage');
    expect(pied.motifs[3]).toBe(MOTIF.colombage | MOTIF.soubassement | MOTIF.sabliereBasse);
    const sousLeToit = peintureDuMur(vois({ cotes: 0b0101, dessus: 'toit', dessous: 'mur' }), 'colombage', { exterieur: dehors });
    expect(sousLeToit.motifs[3]).toBe(MOTIF.colombage | MOTIF.sabliereHaute);
    expect(sousLeToit.motifs[4]).toBe(0);
    const sansToit = peintureDuMur(vois({ cotes: 0b0101, dessous: 'mur' }), 'colombage', { exterieur: dehors });
    expect(sansToit.motifs[3]).toBe(MOTIF.colombage | MOTIF.chaperon);
    // Le dessus du chaperon, en pierre ; le dessous jamais peint.
    expect(sansToit.motifs[4]).toBe(MOTIF.pierreEntiere);
    expect(sansToit.motifs[5]).toBe(0);
  });

  it('un mur qui monte encore (les gradins d’un dôme) n’a pas de chaperon ; un mur plein n’a que sa matière et son chaperon', () => {
    expect(peintureDuMur(vois({ monte: 0b0001, dessous: 'mur' }), 'plein').motifs[0]).toBe(MOTIF.plein);
    const plein = peintureDuMur(vois({ dessous: 'mur' }), 'plein');
    expect(plein.fond).toBe('matiere');
    expect(plein.motifs.slice(0, 4)).toEqual([1, 2, 3, 4].map(() => MOTIF.plein | MOTIF.chaperon));
  });

  it('le pignon (sous un toit, entre deux toits) et les bâtiments du quai sont bardés ; la cheminée (sur un toit) est maçonnée', () => {
    expect(peintureDuMur(vois({ dessus: 'toit', dessous: 'mur', toits: 0b1010 }), 'colombage').fond).toBe('bardage');
    const quai = peintureDuMur(vois({ cotes: 0b0101 }), 'colombage', { barde: true });
    expect(quai.fond).toBe('bardage');
    expect(quai.motifs[3] & 3).toBe(MOTIF.bardage);
    const cheminee = peintureDuMur(vois({ dessous: 'toit' }), 'colombage');
    expect(cheminee.fond).toBe('soubassement');
    expect(cheminee.motifs[0]).toBe(MOTIF.plein | MOTIF.chaperon);
  });

  it('les décharges : au rez, aux bouts et aux angles d’une façade, sur les faces du dehors, jamais sur un mur droit ni un té', () => {
    // À l'étage : aucune (une seule rangée de décharges par façade).
    expect(peintureDuMur(vois({ cotes: 0b0011, dessous: 'mur' }), 'colombage', { exterieur: dehors }).motifs.some(aDesDecharges)).toBe(false);
    // Un mur droit le long de x : aucune décharge.
    expect(peintureDuMur(vois({ cotes: 0b0101 }), 'colombage', { exterieur: dehors }).motifs.some(aDesDecharges)).toBe(false);
    // Un té (voisines +x, +y, −x) : sa face −y a ses deux voisines le long de la face.
    expect(peintureDuMur(vois({ cotes: 0b0111 }), 'colombage', { exterieur: dehors }).motifs.some(aDesDecharges)).toBe(false);
    // Un angle (voisines +x et +y) : ses deux faces libres, −x et −y, en ont une chacune.
    const angle = peintureDuMur(vois({ cotes: 0b0011 }), 'colombage', { exterieur: dehors }).motifs;
    expect([0, 1, 2, 3].map((c) => aDesDecharges(angle[c]))).toEqual([false, false, true, true]);
    // Sur une face du dedans : aucune.
    expect(peintureDuMur(vois({ cotes: 0b0011 }), 'colombage', { exterieur: () => false }).motifs.some(aDesDecharges)).toBe(false);
    // Le bout d'un mur (voisine +x) : ses deux longues faces, pas son bout.
    const bout = peintureDuMur(vois({ cotes: 0b0001 }), 'colombage', { exterieur: dehors }).motifs;
    expect([0, 1, 2, 3].map((c) => aDesDecharges(bout[c]))).toEqual([false, true, false, true]);
  });

  it('toutes les décharges montent dans le même sens, vues du dehors : au plus une par panneau, jamais un chevron', () => {
    // La droite d'une face de normale n, vue du dehors, dans la grille : (−n.y, n.x) (à l'écran, miroir de la grille, la
    // gauche). Le shader lit u selon y (normale x) ou x (normale y).
    expect([0, 1, 2, 3].map(sensDeLaDecharge)).toEqual([MOTIF.montante, MOTIF.descendante, MOTIF.descendante, MOTIF.montante]);
    for (let m = 0; m < 1024; m++) {
      const d = decharge(m | MOTIF.colombage);
      if (!d) continue;
      // Un seul trait par panneau : du pied à la tête, en montant.
      expect(d.tete[1]).toBeGreaterThan(d.pied[1]);
    }
    expect(decharge(MOTIF.colombage | MOTIF.montante)!.tete[0]).toBeGreaterThan(0.5);
    expect(decharge(MOTIF.colombage | MOTIF.descendante)!.tete[0]).toBeLessThan(0.5);
    expect(decharge(MOTIF.bardage | MOTIF.montante)).toBeNull();
  });

  it('dans tout le 6e construit, deux décharges ne se touchent jamais (ni sur une façade, ni autour d’un angle, ni d’un étage à l’autre)', () => {
    const { progress, world: village } = toutConstruit();
    const archi = architectureDe('6e', worldCubes('6e', progress, village, false), { batiments: batimentsDe('6e') });
    // Les deux bouts de chaque décharge, dans le monde.
    const bouts: { id: string; p: [number, number, number] }[] = [];
    for (const [k, { cube: c, peinture }] of archi.peints)
      for (let cote = 0; cote < 4; cote++) {
        const m = peinture.motifs[cote];
        expect(m & MOTIF.montante && m & MOTIF.descendante).toBeFalsy();
        const d = decharge(m);
        if (!d) continue;
        const monde = ([u, v]: [number, number]): [number, number, number] =>
          cote === 0 ? [c.x + 1, c.y + u, c.z + v] : cote === 2 ? [c.x, c.y + u, c.z + v] : cote === 1 ? [c.x + u, c.y + 1, c.z + v] : [c.x + u, c.y, c.z + v];
        bouts.push({ id: `${k}|${cote}`, p: monde(d.pied) }, { id: `${k}|${cote}`, p: monde(d.tete) });
      }
    expect(bouts.length).toBeGreaterThan(20);
    let proche = Infinity;
    for (const a of bouts) for (const b of bouts) if (a.id !== b.id) proche = Math.min(proche, Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]));
    // Au plus près, à un angle : la tête de l'une et le pied de l'autre sur le même poteau, l'une en haut, l'autre en bas
    // (toutes montent dans le même sens) ; entre elles, la hauteur du panneau moins deux jeux : plus que leurs deux
    // demi-largeurs et deux pixels de jour quand une case en fait 16.
    expect(proche).toBeGreaterThan(2 * COLOMBAGE.decharge + 2 / 16);
  }, 30_000);

  it('une décharge ne touche que les poteaux : un jour la sépare de chaque sablière, du chaperon et des bords de la case (aucun angle aigu, pas de « < » ni de V)', () => {
    const C = COLOMBAGE;
    // Les pièces de bois et de pierre horizontales d'un panneau, en hauteur (v) : [bas, haut] de chaque bande, et le jour
    // qu'il faut au moins entre elle et la décharge. Les bords de la case aussi : sur un chantier, un fantôme au-dessus
    // laisse voir le haut de la case comme une arête (la relecture du directeur artistique, 30/09, sur
    // `archi-fantome-pres`). Sous la décharge, la sablière basse : vue de biais, sur une face fuyante, elle file en
    // oblique vers le pied de la décharge ; le jour doit y faire deux pixels quand une case en fait 16 (le colombage y est
    // entièrement peint), sinon les deux se lisent comme un « < ». Le seuil d'avant (0,05 case, moins d'un pixel) ne le
    // voyait pas : il ne mesurait qu'un écart dans la case, pas ce qu'il devient à l'écran.
    const JOUR = 0.05;
    const JOUR_SOUS = 2 / 16;
    const bandes = (m: number): [number, number, number][] => [
      [0, 0, JOUR],
      [1, 1, JOUR],
      ...(m & MOTIF.sabliereBasse ? [[C.soubassement, C.soubassement + C.sabliere, JOUR_SOUS] as [number, number, number]] : []),
      ...(m & MOTIF.sabliereHaute ? [[1 - C.sabliere, 1, JOUR] as [number, number, number]] : []),
      ...(m & MOTIF.chaperon ? [[1 - C.chaperon, 1, JOUR] as [number, number, number]] : []),
    ];
    let n = 0;
    for (let m = 0; m < 1024; m++) {
      const d = decharge(m | MOTIF.colombage);
      if (!d) continue;
      n++;
      // Le trait de la décharge (sa demi-largeur comprise) reste à son jour de chaque bande.
      for (const [b, h, jour] of bandes(m | MOTIF.colombage)) {
        const bas = Math.min(d.pied[1], d.tete[1]) - C.decharge;
        const haut = Math.max(d.pied[1], d.tete[1]) + C.decharge;
        expect(Math.max(b - haut, bas - h), `motif ${m}`).toBeGreaterThan(jour);
      }
      // Ses deux bouts sont sur les poteaux.
      expect([d.pied[0], d.tete[0]].sort()).toEqual([C.poteau, 1 - C.poteau]);
    }
    expect(n).toBeGreaterThan(0);
  });

  it('le bois reste nettement minoritaire (poteaux de 1/8, sablières), le soubassement entre 0,3 et 0,4 case', () => {
    const C = COLOMBAGE;
    expect(2 * C.poteau).toBeCloseTo(1 / 8);
    expect(C.soubassement).toBeGreaterThanOrEqual(0.3);
    expect(C.soubassement).toBeLessThanOrEqual(0.4);
    // La part du bois sur un panneau, au-dessus du soubassement (poteaux, sablières, décharge : longueur × largeur).
    const part = (m: number) => {
      const bas = m & MOTIF.soubassement ? C.soubassement : 0;
      const haut = 1 - bas;
      const d = decharge(m);
      const trait = d ? Math.hypot(d.tete[0] - d.pied[0], d.tete[1] - d.pied[1]) * 2 * C.decharge : 0;
      return (2 * C.poteau * haut + (m & MOTIF.sabliereBasse ? C.sabliere : 0) + (m & MOTIF.sabliereHaute ? C.sabliere : 0) + trait) / haut;
    };
    // Le pire panneau (au rez, sous un toit, à l'angle) : moins de la moitié.
    expect(part(MOTIF.colombage | MOTIF.soubassement | MOTIF.sabliereBasse | MOTIF.sabliereHaute | MOTIF.montante)).toBeLessThan(0.5);
    // Une façade de trois étages (la cabane de la Forêt), à l'angle : moins d'un tiers.
    const angle = [MOTIF.soubassement | MOTIF.sabliereBasse | MOTIF.montante, 0, MOTIF.sabliereHaute].map((m) => MOTIF.colombage | m);
    const hauteurs = [1 - C.soubassement, 1, 1];
    const bois = angle.reduce((n, m, i) => n + part(m) * hauteurs[i], 0) / hauteurs.reduce((a, b) => a + b, 0);
    expect(bois).toBeLessThan(1 / 3);
  });

  it('le shader lit les mêmes bits et les mêmes mesures', () => {
    for (const v of [MOTIF.delave, MOTIF.pierreEntiere, MOTIF.montante | MOTIF.descendante, MOTIF.sabliereBasse, MOTIF.sabliereHaute, MOTIF.chaperon, MOTIF.soubassement])
      expect(MOTIF_GLSL).toContain(`& ${v})`);
    for (const v of [COLOMBAGE.soubassement, COLOMBAGE.sabliere, COLOMBAGE.chaperon, COLOMBAGE.poteau, COLOMBAGE.jeuBas, COLOMBAGE.jeuHaut]) expect(MOTIF_GLSL).toContain(v.toFixed(4));
    // Les dérivées avant le premier retour de `peindreLeMotif` (hors d'un flot uniforme, elles ne sont pas définies).
    const corps = MOTIF_GLSL.slice(MOTIF_GLSL.indexOf('vec3 peindreLeMotif'));
    expect(corps.lastIndexOf('fwidth')).toBeLessThan(corps.indexOf('return'));
  });

  it('une vitre prise dans un mur ne coupe pas la façade : ses voisines restent des murs droits, sans décharge', () => {
    const cube = (x: number, texture = 'planches'): VoxelCube => ({ x, y: 0, z: 1, color: '', texture, tag: 't' });
    const plan = [cube(0), cube(1), cube(2, 'lanterne'), cube(3), cube(4), ...[0, 1, 2, 3, 4].map((x) => ({ ...cube(x), z: 0 }))];
    const index = indexDuPlan(plan);
    expect(voisinageDe(cube(1), index)!.cotes).toBe(0b0101);
    expect(voisinageDe(cube(3), index)!.cotes).toBe(0b0101);
  });
});
