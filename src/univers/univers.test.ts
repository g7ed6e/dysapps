import { createHash } from 'node:crypto';
import { BIOMES } from '../blocland/biomes';
import { sanitizeState } from '../blocland/engine';
import { ARCHIPELAGOS } from '../blocland/world/archipelago';
import { reachedWhaleMoments } from '../blocland/world/whale';
import { pagesBaleine } from './baleine';
import { UNIVERS_OUVERT, textesDe, universAffiche, type TextesUnivers, type UniversId } from '.';

const UNIVERS: UniversId[] = ['archipeo', 'blocland'];

/** Tout ce qu'un univers peut afficher : ses textes, et ses libellés essayés au singulier et au pluriel. */
function tousLesTextes(t: TextesUnivers): string[] {
  const l = t.libelles;
  const out: string[] = [...Object.values(t.especes), l.dejaFait, l.etoiles, ...Object.values(t.baleine.arrivee)];
  for (const g of Object.values(t.gardiens)) out.push(g.challenge, g.guardianSays.hit, g.guardianSays.miss, g.guardianSays.beaten);
  for (const n of [1, 2]) {
    out.push(l.etoilesSur3(n), l.resistance(n, 3), l.encoreAFaire(n), l.navireAttend(n), l.faitsSur(n, 6), l.progres(n, 28));
    out.push(l.navireGardiens(n, 2, 'Premiers Rivages', 'la voile'), l.navireGardiens(0, n, 'Premiers Rivages', 'la voile'));
  }
  out.push(l.dejaFaitArene('Le Grand Chêne'), t.baleine.gardiens('Premiers Rivages'), t.baleine.port('Plaine des nombres'), t.baleine.ouvrage('Mine des lettres'));
  return out;
}

describe('les textes d’univers', () => {
  it('chaque univers a les textes de chaque île, et aucun texte vide', () => {
    for (const u of UNIVERS) {
      const t = textesDe(u);
      expect(Object.keys(t.gardiens).sort()).toEqual(BIOMES.map((b) => b.id).sort());
      expect(Object.keys(t.especes).sort()).toEqual(BIOMES.map((b) => b.id).sort());
      for (const s of tousLesTextes(t)) expect(s.trim()).not.toBe('');
    }
  });

  it('Blocland garde les textes d’avant le lot 6, sans un mot changé', () => {
    // L'empreinte des textes des Gardiens et des espèces tels qu'ils étaient dans biomes.ts avant le lot 6 : un mot
    // changé dans Blocland la change. Les libellés et le mot de la baleine sont écrits en entier ci-dessous.
    const t = textesDe('blocland');
    const avant = Object.fromEntries(
      BIOMES.map((b) => {
        const g = t.gardiens[b.id];
        return [b.id, { challenge: g.challenge, ...g.guardianSays, species: t.especes[b.id] }];
      }),
    );
    expect(createHash('sha256').update(JSON.stringify(avant)).digest('hex')).toBe('5757c1cdbaeadc6823a5125f2a7b0625926ee012352f821b3c4256a23f511eb2');
    const l = t.libelles;
    expect([l.dejaFait, l.etoiles, l.etoilesSur3(2), l.resistance(2, 6), l.dejaFaitArene('Le Grand Chêne')]).toEqual([
      'Déjà vaincu. Une revanche ?',
      'Gardien vaincu',
      'Gardien vaincu : 2 étoiles sur 3',
      '2 épreuves sur 6 avant de le vaincre',
      'Le Grand Chêne est déjà vaincu, mais il aime les revanches.',
    ]);
    expect([l.encoreAFaire(1), l.encoreAFaire(2), l.navireAttend(1), l.navireAttend(2)]).toEqual([
      'encore 1 Gardien à vaincre',
      'encore 2 Gardiens à vaincre',
      'Le Bloc-Navire a tous ses blocs ! Il attend encore 1 Gardien vaincu.',
      'Le Bloc-Navire a tous ses blocs ! Il attend encore 2 Gardiens vaincus.',
    ]);
    expect([l.navireGardiens(1, 3, 'Premiers Rivages', 'la voile'), l.navireGardiens(3, 3, 'Premiers Rivages', 'la voile')]).toEqual([
      'Gardiens : encore 2 à vaincre dans les Premiers Rivages pour la voile.',
      'Gardiens : c’est fait ! 3 sur 3, la voile est là.',
    ]);
    expect([l.faitsSur(1, 10), l.faitsSur(2, 10), l.progres(3, 28)]).toEqual(['1 Gardien vaincu sur 10', '2 Gardiens vaincus sur 10', '3 / 28 Gardiens vaincus']);
  });

  it('tant que l’univers n’est pas ouvert, l’élève ne lit aucun texte « rallumer »', () => {
    expect(UNIVERS_OUVERT).toBe(false);
    for (const choisi of [undefined, ...UNIVERS]) {
      expect(universAffiche(choisi)).toBe('blocland');
      expect(tousLesTextes(textesDe(universAffiche(choisi))).join('\n')).not.toMatch(/rallum/i);
    }
  });

  it('une fois ouvert, l’univers choisi s’affiche, Archipéo par défaut', () => {
    expect(universAffiche(undefined, true)).toBe('archipeo');
    expect(universAffiche('blocland', true)).toBe('blocland');
    expect(universAffiche('archipeo', true)).toBe('archipeo');
  });

  it('Blocland ne rallume jamais ; Archipéo ne fait jamais tomber un Gardien', () => {
    expect(tousLesTextes(textesDe('blocland')).join('\n')).not.toMatch(/rallum/i);
    const archipeo = tousLesTextes(textesDe('archipeo')).join('\n');
    expect(archipeo).not.toMatch(/vainc|vainq|revanche|\bbat(s|tre|tu)\b|écroul/i);
    expect(archipeo).toMatch(/rallum/);
  });

  it('dans Archipéo, une épreuve ratée n’éteint rien, et le dit toujours de la même façon', () => {
    for (const g of Object.values(textesDe('archipeo').gardiens)) expect(g.guardianSays.miss).toMatch(/^Rien ne s’éteint\. /);
  });

  it('dans Archipéo, la réplique finale dit que la sentinelle se rallume, sans promettre qu’elle brille toute', () => {
    // On gagne le défi avant d'avoir tout réussi, et le rallumage se voit au village : « brille à nouveau » est à lui.
    for (const g of Object.values(textesDe('archipeo').gardiens)) {
      expect(g.guardianSays.beaten).toMatch(/se rallume(nt)?\b/);
      expect(g.guardianSays.beaten).not.toMatch(/brillent? à nouveau|^Tou(te)?s? /);
    }
  });

  it('le mot de la baleine : mêmes étapes dans les deux univers, seul le mot des Gardiens change', () => {
    const guardians = Object.fromEntries(BIOMES.filter((b) => b.classe === '6e').map((b) => [`${b.id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
    const moments = reachedWhaleMoments(sanitizeState({ progress: guardians }), '6e');
    const gardiens = moments.find((m) => m.kind === 'gardiens')!;
    expect(pagesBaleine(gardiens, textesDe('blocland'))).toEqual(['Tous les Gardiens des Premiers Rivages ont reconnu ton savoir. Je l’ai vu depuis le large.']);
    expect(pagesBaleine(gardiens, textesDe('archipeo'))).toEqual(['Tous les Gardiens des Premiers Rivages brillent à nouveau. J’ai vu leur lumière depuis le large.']);
    for (const a of ARCHIPELAGOS) {
      const arrivee = { id: `archipel-${a.classe}`, kind: 'arrivee' as const, archipelago: a.classe, island: a.port };
      expect(pagesBaleine(arrivee, textesDe('archipeo'))).toEqual(pagesBaleine(arrivee, textesDe('blocland')));
    }
  });
});
