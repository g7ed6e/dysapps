import type { VoxelCube } from '../cube';
import { toutConstruit, toutConstruitAvecLesCommandes } from '../budget';
import { ARCHIPELAGO_IDS } from '../map';
import { worldCubes } from '../terrain';
import { batimentsDe, coursDe } from '../construction';
import { architectureDe, FORMES, kitVide, MOTIF, pieceDe, voisinageDe, indexDuPlan, type IdDePiece, type Kit } from '.';
import { boiteDansLaCase, FACES, facettesPosees, tournerCouvre, trianglesDe, TOUTES_LES_FACES, type DessinDePiece } from './rooms';
import { KIT_6E } from './kits/6e';
import { BRUME } from '../palette';
import { ARDOISES } from '../roofs';
import { couleurDuRole } from '../construction/settings';

const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

/** Toutes les pièces de mur possibles. */
function toutesLesPieces(): IdDePiece[] {
  const out: IdDePiece[] = [];
  for (const { forme } of FORMES)
    for (const pied of ['pied', 'haut', 'pilotis'] as const) for (const tete of ['chaperon', 'toit', 'mur'] as const) out.push(`mur.${forme}.${pied}.${tete}`);
  return out;
}

/** Un kit d'essai : la pierre et les planches dessinées partout par `dessin`. */
function kitDEssai(dessin: DessinDePiece): Kit {
  const pieces = Object.fromEntries(toutesLesPieces().map((p) => [p, dessin]));
  return { ...kitVide(), matieres: { pierre: 'pierre', planches: 'colombage' }, pieces: { pierre: pieces, colombage: pieces } };
}

const cube = (x: number, y: number, z: number, texture = 'pierre', autre: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', texture, tag: 'port', ...autre });

describe('L’architecture modulaire', () => {
  it('la table commune s’active partout (le 4e et le 3e le 10 octobre 2026), sur tout un archipel construit, cours, monuments et petites constructions comprises ; un kit vide ne remplace ni ne peint rien', () => {
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    for (const a of ARCHIPELAGO_IDS) {
      const cubes = worldCubes(a, progress, village, false);
      const archi = architectureDe(a, cubes, { batiments: batimentsDe(a), cours: coursDe(a) });
      expect(archi.pieces.length, a).toBeGreaterThan(0);
      expect(archi.peints.size, a).toBeGreaterThan(0);
      // Les monuments, la cour (la troisième étape) et les petites constructions des commandes et des quêtes aussi.
      const pris = [...archi.pieces.map((p) => p.cube), ...[...archi.peints.values()].map((p) => p.cube)];
      expect(pris.some((c) => c.place?.startsWith('monument:')), a).toBe(true);
      expect(pris.some((c) => c.petiteConstruction), a).toBe(true);
      expect(pris.some((c) => coursDe(a).has(cle(c))), a).toBe(true);
      // Un kit vide : rien ne change.
      const vide = architectureDe(a, cubes, { kit: kitVide(), batiments: batimentsDe(a), cours: coursDe(a) });
      expect(vide.remplacees.size, a).toBe(0);
      expect(vide.peints.size, a).toBe(0);
      expect(vide.triangles, a).toBe(0);
    }
  }, 30_000);

  it('avec un kit, seuls les blocs posés d’une matière du kit deviennent pièces : ni fantôme, ni verre, ni lanterne, ni borne, ni un lieu', () => {
    const kit = kitDEssai(boiteDansLaCase(0, 1, 0, 1, 0, 1));
    const cubes = [
      cube(0, 0, 1),
      cube(1, 0, 1, 'planches'),
      cube(2, 0, 1, 'pierre', { ghost: true }),
      cube(3, 0, 1, 'verre'),
      cube(0, 0, 2, 'lanterne'),
      cube(4, 0, 1, 'pierre', { quest: 'port:1' }),
      cube(5, 0, 1, 'pierre', { sol: true }),
      cube(6, 0, 1, 'brique'),
      cube(7, 0, 1, 'pierre'),
      cube(8, 0, 1, 'pierre', { place: 'school' }),
    ];
    const archi = architectureDe('6e', cubes, { kit, exclure: (c) => c.x === 7 });
    expect([...archi.remplacees].sort()).toEqual(['0,0,1', '1,0,1']);
    expect(archi.pieces.map((p) => p.famille)).toEqual(['pierre', 'colombage']);
    // La planche voit la pierre à sa gauche et le fantôme à sa droite (le plan entier) : un mur droit.
    expect(archi.pieces[1].piece).toBe('mur.droit.pied.chaperon');
    expect(archi.triangles).toBe(2 * 12);
  });

  it('la pièce et son orientation sont celles de la règle, et la table des faces fermées suit la rotation', () => {
    // Une demi-boîte collée au côté −y de sa case : elle ne ferme que le sud.
    const demi = boiteDansLaCase(0, 1, 0, 0.5, 0, 1);
    expect(demi.couvre).toBe(FACES.sud);
    const cubes = [cube(0, 0, 1), cube(0, 1, 1)];
    const archi = architectureDe('6e', cubes, { kit: kitDEssai(demi) });
    for (const p of archi.pieces) {
      const v = voisinageDe(p.cube, indexDuPlan(cubes))!;
      expect(pieceDe(v)).toEqual({ piece: p.piece, rotation: p.rotation });
      expect(archi.couvre.get(cle(p.cube))).toBe(tournerCouvre(demi.couvre, p.rotation));
    }
  });

  it('une pièce reste dans sa case, quelle que soit sa rotation', () => {
    const d = boiteDansLaCase(0.1, 0.6, 0, 0.3, 0, 0.8);
    for (let r = 0; r < 4; r++)
      for (const f of facettesPosees(d, r, 10, 20, 3))
        for (const [x, y, z] of f.points) {
          expect(x >= 10 && x <= 11 && y >= 20 && y <= 21 && z >= 3 && z <= 4).toBe(true);
        }
    expect(trianglesDe(d)).toBe(12);
  });

  it('les faces fermées d’une boîte : pleine, toutes ; tournée, les côtés tournent avec elle', () => {
    expect(boiteDansLaCase(0, 1, 0, 1, 0, 1).couvre).toBe(TOUTES_LES_FACES);
    // À mi-hauteur, les côtés ne sont qu'à moitié couverts : seul le bas est fermé.
    expect(boiteDansLaCase(0, 1, 0, 1, 0, 0.5).couvre).toBe(FACES.bas);
    expect(boiteDansLaCase(0, 1, 0, 0.5, 0, 1).couvre).toBe(FACES.sud);
    expect(tournerCouvre(FACES.est | FACES.haut, 1)).toBe(FACES.nord | FACES.haut);
    expect(tournerCouvre(FACES.sud, 1)).toBe(FACES.est);
    expect(tournerCouvre(FACES.est, 4)).toBe(FACES.est);
  });
});

describe('Le kit des Premiers Rivages (lot 7b)', () => {
  it('porte les couleurs de l’archipel par rôle (intention du directeur artistique)', () => {
    expect(KIT_6E.couleurs).toEqual({
      poteau: 0x795643,
      remplissage: 0xd9c7a8,
      soubassement: 0x8a8f84,
      chaperon: 0x8a8f84,
      bardage: 0xb1815e,
      pilotis: 0x6e4c30,
      tole: 0xa4aab0,
      joint: 0x7e848a,
      galon: 0xcca22e,
      // Le reste (9 octobre 2026) : la braise mate, l'eau en nappe, le nénuphar, la paille.
      braise: 0xc0764a,
      nappe: 0x178078,
      lisere: 0xe5ebe3,
      flanc: 0x142b38,
      feuille: 0x4e8f36,
      paille: 0xe8c66f,
    });
    expect(KIT_6E.murs).toEqual({ colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tole' });
    // La finition, matière par matière : la porte peinte, la marche et la barrière dessinées (la barrière depuis le 9 octobre 2026).
    expect(Object.keys(KIT_6E.finitions ?? {}).sort()).toEqual(['barriere', 'escalier', 'marche', 'porte']);
    // Le verre et les lanternes n'ont pas de famille : ils ne deviennent jamais des pièces.
    expect(KIT_6E.matieres.verre).toBeUndefined();
    expect(KIT_6E.matieres.lanterne).toBeUndefined();
  });

  it('le torchis du colombage est un crème chaud, loin du fantôme Brume, de la pierre et de l’ardoise (DA, 8 octobre 2026)', () => {
    const rvb = (c: number) => [c >> 16, (c >> 8) & 255, c & 255];
    const ecart = (a: number, b: number) => Math.hypot(...rvb(a).map((v, i) => v - rvb(b)[i]));
    const chaleur = (c: number) => rvb(c)[0] - rvb(c)[2];
    const torchis = KIT_6E.couleurs.remplissage!;
    // Chaud : tiré vers le Sable #DAA66A, il se lit crème à l'ombre, et non gris-bleu comme l'ancien #D8D9C9.
    expect(chaleur(torchis)).toBeGreaterThanOrEqual(40);
    expect(chaleur(0xd8d9c9)).toBeLessThan(20);
    // Bien distinct du fantôme, tel quel et sous le voile de l'archipel.
    expect(ecart(torchis, BRUME)).toBeGreaterThanOrEqual(60);
    expect(ecart(couleurDuRole('6e', KIT_6E, 'remplissage'), BRUME)).toBeGreaterThanOrEqual(60);
    // Et de la pierre (le soubassement, le chaperon) et des toits d'ardoise en niveaux de gris, qui n'ont presque pas de chaleur.
    for (const gris of [KIT_6E.couleurs.soubassement!, KIT_6E.couleurs.chaperon!, ...Object.values(ARDOISES).flatMap((a) => [a.dessus, a.rives])]) {
      expect(ecart(torchis, gris)).toBeGreaterThanOrEqual(60);
      expect(chaleur(torchis) - chaleur(gris)).toBeGreaterThanOrEqual(30);
    }
  });

  it('les maisons de bois en colombage, celles de pierre en mur plein, les toits en pente ; les monuments aussi ; ni la cour sans elle, ni l’école sans son modèle', () => {
    const { progress, world: village } = toutConstruit();
    const cubes = worldCubes('6e', progress, village, false);
    // Les plans seuls : le reste (le cœur, les liaisons, les lieux) a son test (./heart.test.ts).
    const archi = architectureDe('6e', cubes, { batiments: batimentsDe('6e'), kit: { ...KIT_6E, reste: undefined } });
    const parIle = (ile: string) => [...archi.peints.values()].filter((p) => p.cube.tag === ile && !p.cube.place);
    // La cabane de la Forêt (planches) : du colombage, des pignons bardés, une cheminée maçonnée, une porte en vantail.
    const foret = parIle('french-6e-phonology');
    expect(new Set(foret.map((p) => p.peinture.fond))).toEqual(new Set(['remplissage', 'bardage', 'soubassement', 'matiere']));
    expect(foret.filter((p) => p.peinture.fond === 'remplissage').every((p) => (p.peinture.motifs[0] & 3) === MOTIF.colombage)).toBe(true);
    expect(foret.filter((p) => p.peinture.fond === 'matiere').every((p) => p.cube.texture === 'porte' && p.peinture.motifs[0] === MOTIF.vantail)).toBe(true);
    // La forge de la Mine (pierre) : un mur plein, sa porte en vantail.
    expect(parIle('french-6e-letter-confusion').every((p) => p.peinture.fond === 'matiere' && ((p.peinture.motifs[0] & 3) === MOTIF.plein || p.cube.texture === 'porte'))).toBe(true);
    // Les toits des bâtiments : des pentes (versants, faîtes, arêtiers, croupes), aucune pièce hors d'un toit ni de pilotis.
    const batiments = batimentsDe('6e');
    const pentes = new Set(archi.pieces.filter((p) => batiments.has(cle(p.cube))).map((p) => p.piece.split('.').slice(0, 2).join('.')));
    expect([...pentes].sort()).toEqual(['toit.aretier', 'toit.croupe', 'toit.faite', 'toit.versant']);
    // Les monuments prennent la table (décision du directeur artistique, 8 octobre 2026) ; rien d'un lieu du village sans
    // son modèle (`caseDuLieu`), rien de la cour sans elle (`cours`), rien hors des bâtiments et des monuments.
    const monuments = [...archi.peints.values()].filter((p) => p.cube.place?.startsWith('monument:'));
    expect(monuments.length).toBeGreaterThan(20);
    for (const p of [...archi.pieces, ...archi.peints.values()]) {
      if (p.cube.place?.startsWith('monument:')) continue;
      // Les poteaux de bois des liaisons et de la jetée (le végétal) : d'aucun plan.
      if (p.famille === 'vegetal') {
        expect(p.cube.texture).toBe('tronc');
        continue;
      }
      expect(p.cube.place).toBeUndefined();
      expect(batiments.has(cle(p.cube))).toBe(true);
    }
    expect([...archi.peints.values()].some((p) => p.cube.texture === 'barriere' || p.cube.texture === 'escalier')).toBe(false);
    // Le haut d'un versant (un versant qui ne monte pas : ./choices.ts) ne sert qu'aux lieux du village, au toit de quatre
    // rangées de l'école : aucun versant d'un plan ne le prend.
    const index = indexDuPlan(
      [...batiments].map(([k, texture]) => {
        const [x, y, z] = k.split(',').map(Number);
        return { x, y, z, texture, color: '' };
      }),
    );
    const versants = archi.pieces.filter((p) => p.piece.startsWith('toit.versant'));
    expect(versants.length).toBeGreaterThan(0);
    for (const p of versants) expect(voisinageDe(p.cube, index)?.monte, cle(p.cube)).not.toBe(0);
  }, 30_000);

  it('au 6e, la pierre garde sa teinte : soubassement à partir de trois rangées seulement ; le bois des monuments et des petites constructions est bardé', () => {
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    const cubes = worldCubes('6e', progress, village, false);
    const archi = architectureDe('6e', cubes, { batiments: batimentsDe('6e'), cours: coursDe('6e') });
    // Les murs du monde, une fenêtre prise dans un mur comprise (tous les plans ensemble : au plus, la colonne s'allonge).
    const plan = indexDuPlan(cubes.filter((c) => !c.ghost));
    const colonne = (c: VoxelCube) => {
      let n = 1;
      for (let z = c.z - 1; plan.get(`${c.x},${c.y},${z}`) === 'mur'; z--) n++;
      for (let z = c.z + 1; plan.get(`${c.x},${c.y},${z}`) === 'mur'; z++) n++;
      return n;
    };
    let pleins = 0;
    for (const p of archi.peints.values()) {
      const genre = p.peinture.motifs[0] & 3;
      if (p.peinture.fond !== 'matiere' && p.peinture.fond !== 'bardage') continue;
      if (genre !== MOTIF.plein && genre !== MOTIF.bardage) continue;
      pleins++;
      // Un soubassement : au pied d'une colonne d'au moins trois rangées (les murs peints empilés, lus sur le monde).
      if (p.peinture.motifs.slice(0, 4).some((m) => m & MOTIF.soubassement)) expect(colonne(p.cube), cle(p.cube)).toBeGreaterThanOrEqual(3);
    }
    expect(pleins).toBeGreaterThan(100);
    // Le bois d'un monument ou d'une petite construction : bardé (le brun du kit), jamais le colombage crème.
    const horsDesMaisons = [...archi.peints.values()].filter((p) => (p.cube.place?.startsWith('monument:') || p.cube.petiteConstruction) && p.famille === 'colombage');
    expect(horsDesMaisons.length).toBeGreaterThan(10);
    for (const p of horsDesMaisons) expect(p.peinture.fond, cle(p.cube)).not.toBe('remplissage');
  }, 30_000);

  it('un mur ne change pas quand l’étape suivante de son bâtiment arrive dans le monde (la règle lit le bâtiment entier)', () => {
    const { progress, world: village } = toutConstruit();
    const tout = architectureDe('6e', worldCubes('6e', progress, village, false), { batiments: batimentsDe('6e') });
    // Les murs seuls de la Forêt : sans le toit ni la cour dans le monde.
    const plans = Object.fromEntries(Object.entries(village.parts).filter(([k]) => k !== 'french-6e-phonology-2' && k !== 'french-6e-phonology-3'));
    const murs = architectureDe('6e', worldCubes('6e', progress, { ...village, parts: plans }, false), { batiments: batimentsDe('6e') });
    const foret = [...murs.peints].filter(([, p]) => p.cube.tag === 'french-6e-phonology');
    expect(foret.length).toBeGreaterThan(20);
    for (const [k, p] of foret) expect(p.peinture, k).toEqual(tout.peints.get(k)!.peinture);
  }, 30_000);

  it('sur le vide (l’eau), un mur de bois prend des pilotis ; au sol, un soubassement', () => {
    const plan = [cube(0, 0, 0, 'planches'), cube(1, 0, 0, 'planches'), cube(0, 0, 1, 'planches'), cube(1, 0, 1, 'planches')];
    const archi = architectureDe('6e', plan, { kit: KIT_6E, surLeVide: (x) => x === 1 });
    expect(archi.pieces.map((p) => p.piece)).toEqual(['mur.bout.pilotis.mur']);
    expect(archi.pieces[0].facettes.some((f) => f.role === 'pilotis')).toBe(true);
    const sol = archi.peints.get('0,0,0')!;
    expect(sol.peinture.motifs[3] & MOTIF.soubassement).toBeTruthy();
  });
});
