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
  out.push(l.defiPret, l.defiPretCourt, l.defiFerme('Le Grand Chêne', 2), l.arene('le Grand Chêne'));
  const d = t.sentinelles;
  if (d) {
    out.push(d.consigne, d.jauge, d.seuil(5, false), d.seuil(5, true), d.rallume('Le Grand Chêne'));
    for (const n of [0, 1, 2]) out.push(d.compte(n, 7), d.jaugeLue(n, 7, 5));
  }
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
    // Les îles venues après le lot 6 (le Relais des voyageurs, LV2) n'ont pas de texte « d'avant » : hors de l'empreinte.
    const APRES_LE_LOT_6 = new Set(['relais']);
    const avant = Object.fromEntries(
      BIOMES.filter((b) => !APRES_LE_LOT_6.has(b.id)).map((b) => {
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

  it('une fois ouvert, l’univers choisi s’affiche, Blocland par défaut', () => {
    expect(universAffiche(undefined, true)).toBe('blocland');
    expect(universAffiche('blocland', true)).toBe('blocland');
    expect(universAffiche('archipeo', true)).toBe('archipeo');
  });

  it('Blocland ne rallume jamais ; Archipéo ne fait jamais tomber un Gardien', () => {
    expect(tousLesTextes(textesDe('blocland')).join('\n')).not.toMatch(/rallum/i);
    const archipeo = tousLesTextes(textesDe('archipeo')).join('\n');
    expect(archipeo).not.toMatch(/vainc|vainq|revanche|\bbat(s|tre|tu)\b|écroul/i);
    expect(archipeo).toMatch(/rallum/);
    const l = textesDe('archipeo').libelles;
    expect([l.etoilesSur3(1), l.etoilesSur3(2), l.resistance(1, 3), l.resistance(2, 3)]).toEqual([
      'Gardien rallumé : 1 étoile sur 3',
      'Gardien rallumé : 2 étoiles sur 3',
      'Encore 1 épreuve sur 3 pour le rallumer',
      'Encore 2 épreuves sur 3 pour le rallumer',
    ]);
    // Lu à voix haute : pas de points de suspension dans les textes neufs (Blocland garde les siens).
    expect(Object.values(textesDe('archipeo').gardiens).flatMap((g) => Object.values(g.guardianSays).concat(g.challenge)).join('\n')).not.toMatch(/…/);
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
    const gardiens = moments.find((m) => m.kind === 'gardiens');
    if (!gardiens) throw new Error('étape « gardiens » non atteinte');
    expect(pagesBaleine(gardiens, textesDe('blocland'))).toEqual(['Tous les Gardiens des Premiers Rivages ont reconnu ton savoir. Je l’ai vu depuis le large.']);
    expect(pagesBaleine(gardiens, textesDe('archipeo'))).toEqual(['Tous les Gardiens des Premiers Rivages brillent à nouveau. J’ai vu leur lumière depuis le large.']);
    for (const a of ARCHIPELAGOS) {
      const arrivee = { id: `archipel-${a.classe}`, kind: 'arrivee' as const, archipelago: a.classe, island: a.port };
      expect(pagesBaleine(arrivee, textesDe('archipeo'))).toEqual(pagesBaleine(arrivee, textesDe('blocland')));
    }
  });

  it('Blocland garde son arène : pas de sentinelles, et ses mots du défi d’avant le lot 6', () => {
    const t = textesDe('blocland');
    expect(t.sentinelles).toBeNull();
    expect([t.libelles.defiPret, t.libelles.defiPretCourt, t.libelles.defiFerme('Le Grand Chêne', 2), t.libelles.arene('le Grand Chêne')]).toEqual([
      'Le Gardien accepte ton défi !',
      'Prêt à t’affronter',
      'Le Grand Chêne n’accepte que les bâtisseurs entraînés. Obtiens 2 étoiles dans chaque mission, puis reviens.',
      'L’arène du Gardien',
    ]);
  });

  it('Archipéo : le défi d’une sentinelle compte les réussites, écrit le seuil, et ne combat jamais', () => {
    const t = textesDe('archipeo');
    const d = t.sentinelles!;
    expect(t.libelles.arene('le Grand Chêne')).toBe('Le défi du Grand Chêne');
    expect(t.libelles.arene('la Dune vivante')).toBe('Le défi de la Dune vivante');
    expect(t.libelles.arene('l’Hydre des marais')).toBe('Le défi de l’Hydre des marais');
    expect([d.compte(2, 7), d.seuil(5, false), d.seuil(5, true)]).toEqual(['2 sur 7', 'Il en faut 5 pour la rallumer.', 'C’est assez pour la rallumer.']);
    expect([d.jaugeLue(1, 7, 5), d.jaugeLue(2, 7, 5)]).toEqual(['1 épreuve réussie sur 7, il en faut 5', '2 épreuves réussies sur 7, il en faut 5']);
    expect(d.rallume('Le Grand Chêne')).toBe('Le Grand Chêne brille à nouveau.');
    expect(tousLesTextes(t).join('\n')).not.toMatch(/bâtisseur|affront|arène/);
    const neufs = [t.libelles.defiPret, t.libelles.defiPretCourt, t.libelles.defiFerme('Le Grand Chêne', 2), d.consigne, d.seuil(5, true)];
    expect(neufs.join('\n')).not.toMatch(/!/);
    // « brille à nouveau » : au village et à la baleine seulement.
    for (const g of Object.values(t.gardiens)) expect(Object.values(g.guardianSays).join()).not.toMatch(/à nouveau/);
  });
});
