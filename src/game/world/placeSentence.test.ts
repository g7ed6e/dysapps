// La phrase qui dit où est une place (GD-9) : « au nord de la Forêt des sons, à 2 cases ».
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { BIOMES } from '../biomes';
import { freeSpots, guardianOf, moveGuardian, startingSpot } from './arrange';
import { casesWord, DIRECTIONS, distanceWords, directionWords, guardianSentence, guardianSigns, ofPlace, placeSentence, placeSigns, placeSignsSentence, thePlace, toPlace } from './placeSentence';
import { lieuDAssemblage } from './assembly';
import { agreeWithPlace, joinedSentence } from './placeArticle';

const VIDE: World = { parts: {}, log: [], links: [] };

describe('où est une place, en mots', () => {
  it('les directions comme on les voit sur la Carte : le nord en haut (y qui monte), l’est à droite (x qui descend), huit en tout', () => {
    // La caméra de la Carte regarde depuis les y bas : les x du monde qui montent vont à gauche de l'écran
    // (three/arrangeDirections.test.ts le vérifie sur sa projection).
    const o = { x: 0, y: 0 };
    expect(directionWords(o, { x: 0, y: 10 })).toBe('au nord');
    expect(directionWords(o, { x: 0, y: -10 })).toBe('au sud');
    expect(directionWords(o, { x: -10, y: 0 })).toBe('à l’est');
    expect(directionWords(o, { x: 10, y: 0 })).toBe('à l’ouest');
    expect(directionWords(o, { x: -10, y: 10 })).toBe('au nord-est');
    expect(directionWords(o, { x: 10, y: -9 })).toBe('au sud-ouest');
  });

  it('« à 2 cases » : l’écart d’eau en cases de la grille des places, une au moins', () => {
    expect(distanceWords(8)).toBe('à 2 cases');
    expect(distanceWords(4)).toBe('à 1 case');
    expect(distanceWords(1)).toBe('à 1 case');
  });

  it('chaque nom de lieu avec son article : de la, du, de l’', () => {
    expect(ofPlace('Forêt des sons')).toBe('de la Forêt des sons');
    expect(ofPlace('Volcan des décimaux')).toBe('du Volcan des décimaux');
    expect(ofPlace('Atelier du calcul littéral')).toBe('de l’Atelier du calcul littéral');
    expect(ofPlace('Horloge des verbes')).toBe('de l’Horloge des verbes');
    expect(ofPlace('Observatoire des textes')).toBe('de l’Observatoire des textes');
    expect(ofPlace('Forge des puissances')).toBe('de la Forge des puissances');
    // Aucun nom ne reste sans article.
    for (const b of BIOMES) expect(ofPlace(b.name)).toMatch(/^(de la |du |de l’)/);
  });

  it('un seul utilitaire d’article, accordé, pour les noms des lieux des deux univers (leurs lieux et leur lieu d’assemblage)', () => {
    expect(thePlace('Tour du lecteur')).toBe('la Tour du lecteur');
    expect(thePlace('Volcan des décimaux')).toBe('le Volcan des décimaux');
    expect(thePlace('Horloge des verbes')).toBe('l’Horloge des verbes');
    expect(toPlace('Ferme des accords')).toBe('à la Ferme des accords');
    expect(toPlace('Marché des proportions')).toBe('au Marché des proportions');
    expect(toPlace('Atelier du calcul littéral')).toBe('à l’Atelier du calcul littéral');
    const assemblage = (['blocland', 'archipeo'] as const).map((u) => lieuDAssemblage(u).titre.replace(/^(La |Le |L’)/, ''));
    for (const nom of [...BIOMES.map((b) => b.name), ...assemblage]) {
      const le = thePlace(nom);
      expect(le).toMatch(/^(la |le |l’)/);
      // Les trois formes s'accordent entre elles : « de la » / « à la », « du » / « au », « de l’ » / « à l’ ».
      const forme = le.startsWith('la ') ? 0 : le.startsWith('le ') ? 1 : 2;
      expect(ofPlace(nom)).toBe([`de ${le}`, `du ${nom}`, `de ${le}`][forme]);
      expect(toPlace(nom)).toBe([`à ${le}`, `au ${nom}`, `à ${le}`][forme]);
    }
  });

  it('« réuni » s’accorde avec le premier lieu : féminin et féminin, masculin et féminin, féminin et masculin', () => {
    expect(joinedSentence('Tour du lecteur', 'Ferme des accords')).toBe('La Tour du lecteur est réunie à la Ferme des accords.');
    expect(joinedSentence('Horloge des verbes', 'Baie des mots')).toBe('L’Horloge des verbes est réunie à la Baie des mots.');
    expect(joinedSentence('Volcan des décimaux', 'Mine des lettres')).toBe('Le Volcan des décimaux est réuni à la Mine des lettres.');
    expect(joinedSentence('Atelier du calcul littéral', 'Forge des puissances')).toBe('L’Atelier du calcul littéral est réuni à la Forge des puissances.');
    expect(joinedSentence('Rivière des fractions', 'Volcan des décimaux')).toBe('La Rivière des fractions est réunie au Volcan des décimaux.');
    expect(agreeWithPlace('Mine des lettres', 'Réuni')).toBe('Réunie');
    expect(agreeWithPlace('Marché des proportions', 'Réuni')).toBe('Réuni');
    // Le genre suit l'article de chaque nom qui en montre un (« la » : féminin, « le » : masculin).
    for (const b of BIOMES) {
      const le = thePlace(b.name);
      if (!le.startsWith('l’')) expect(agreeWithPlace(b.name, 'réuni')).toBe(le.startsWith('la ') ? 'réunie' : 'réuni');
    }
  });

  it('dit le voisin le plus proche, sa direction et l’écart, avec les noms de l’univers', () => {
    const id: BiomeId = 'english-6e-vocabulary';
    // Derrière la Forêt des sons, à côté de l'Horloge des verbes, à sa droite sur la Carte.
    expect(placeSentence(VIDE, id)).toMatch(/^à l’est de l’Horloge des verbes, à \d+ cases?$/);
    expect(placeSentence(VIDE, id, startingSpot(id), (x) => `Lieu ${x}`)).toMatch(/du Lieu /);
    // Une autre place, une autre phrase (le fantôme la dit à chaque calage).
    const ailleurs = freeSpots(VIDE, id).find((s) => Math.abs(s.x - startingSpot(id).x) + Math.abs(s.y - startingSpot(id).y) > 2);
    if (ailleurs) expect(typeof placeSentence(VIDE, id, ailleurs)).toBe('string');
  });

  it('la ligne de signes (piste A) : le voisin, la flèche, le nombre ; dite en mots, la même phrase', () => {
    const id: BiomeId = 'english-6e-vocabulary';
    const s = placeSigns(VIDE, id)!;
    expect(s).toMatchObject({ voisin: 'Horloge des verbes', direction: { mot: 'est', icone: 'est' } });
    expect(s.cases).toBeGreaterThan(0);
    expect(placeSignsSentence(s)).toBe(placeSentence(VIDE, id));
    expect(placeSignsSentence({ voisin: 'Mine des lettres', direction: DIRECTIONS[3], cases: 4 })).toBe('au nord-ouest de la Mine des lettres, à 4 cases');
    expect(casesWord(1)).toBe('1 case');
    // Huit flèches, une par direction, toutes différentes.
    expect(new Set(DIRECTIONS.map((d) => d.icone)).size).toBe(8);
  });

  it('l’îlot d’un Gardien : « au sud de son île », puis le côté où il va', () => {
    const id: BiomeId = 'maths-6e-decimals';
    expect(guardianSentence(VIDE, id)).toBe('au sud de son île');
    const r = moveGuardian(VIDE, id, { side: 'right', step: -1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(guardianOf(r.world, id).side).toBe('right');
      expect(guardianSentence(r.world, id)).toMatch(/ouest de son île$/);
    }
  });

  it('l’îlot d’un Gardien en signes, comme un lieu : son île pour repère, la flèche, l’écart', () => {
    const id: BiomeId = 'maths-6e-decimals';
    const s = guardianSigns(VIDE, id, undefined, () => 'Volcan');
    expect(s.voisin).toBe('Volcan');
    expect(s.direction.mot).toBe('sud');
    expect(s.cases).toBeGreaterThanOrEqual(1);
    expect(placeSignsSentence(s)).toMatch(/^au sud du Volcan, à \d+ cases?$/);
  });
});
