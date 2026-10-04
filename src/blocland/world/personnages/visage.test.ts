// Le visage du joueur (choix « 1a » du mainteneur, 4 octobre 2026) : en pixels dans Blocland, en facettes dans
// Archipéo, tiré du bonhomme peint ; le médaillon « toi » de la Carte le porte aux couleurs des bulles de l'univers.
import { VISAGE_DU_BONHOMME } from '../../Avatar';
import { HABILLAGES } from '../../habillage';
import { COULEURS_DES_SIGNES, drawMedaillon } from '../labelCanvas';
import { BONHOMME, OEIL } from './couleurs';
import { COTE_DU_VISAGE, VISAGE_DU_BONHOMME_PEINT, visageDuJoueur } from './visage';

const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

it('chaque univers a le visage de ses personnages', () => {
  expect(visageDuJoueur(HABILLAGES.blocland)).toBe(VISAGE_DU_BONHOMME);
  expect(visageDuJoueur(HABILLAGES.archipeo)).toBe(VISAGE_DU_BONHOMME_PEINT);
});

it('le visage d’Archipéo : les couleurs du bonhomme peint, deux yeux symétriques, rien hors de son carré', () => {
  const { facettes } = VISAGE_DU_BONHOMME_PEINT;
  const couleurs = new Set(facettes.map((f) => f.couleur));
  expect(couleurs).toContain(css(BONHOMME.peau));
  expect(couleurs).toContain(css(BONHOMME.cheveux));
  const yeux = facettes.filter((f) => f.couleur === css(OEIL));
  expect(yeux).toHaveLength(2);
  const milieu = (f: (typeof facettes)[number]) => f.points.reduce((s, [x]) => s + x, 0) / f.points.length;
  expect(milieu(yeux[0]) + milieu(yeux[1])).toBeCloseTo(COTE_DU_VISAGE, 6);
  for (const f of facettes) for (const [x, y] of f.points) expect(x >= 0 && x <= COTE_DU_VISAGE && y >= 0 && y <= COTE_DU_VISAGE).toBe(true);
});

it('le médaillon « toi » : le rond aux couleurs des bulles, puis le visage ; jamais la couleur de la prochaine chose', () => {
  const remplis: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (cible, nom: string) => (nom === 'fill' ? () => remplis.push(String(cible.fillStyle)) : (cible[nom] ?? (() => {}))),
    set: (cible, nom: string, valeur) => ((cible[nom] = valeur), true),
  }) as unknown as CanvasRenderingContext2D;
  const { encre, fond, avant } = COULEURS_DES_SIGNES.hexagone;
  drawMedaillon(ctx, 48, 44, 40, VISAGE_DU_BONHOMME_PEINT, COULEURS_DES_SIGNES.hexagone);
  expect(remplis.slice(0, 3)).toEqual([encre, encre, fond]);
  expect(remplis.slice(3)).toEqual(VISAGE_DU_BONHOMME_PEINT.facettes.map((f) => f.couleur));
  expect(remplis).not.toContain(avant);
});
