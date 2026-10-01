import { createHash } from 'node:crypto';
import { BIOMES } from '../blocland/biomes';
import { sanitizeState } from '../blocland/engine';
import { ARCHIPELAGOS, NOMS_ARCHIPELS } from '../blocland/world/archipelago';
import { reachedWhaleMoments, type WhaleMoment } from '../blocland/world/whale';
import { BADGES, ROLES } from '../core/progress';
import { pagesBaleine, quiParle, titreDuMot } from './baleine';
import { nomDuRole, texteDuMonument, texteDuSucces, textesDe, universAffiche, type TextesUnivers, type UniversId } from '.';

const UNIVERS: UniversId[] = ['archipeo', 'blocland'];

/** Tout ce qu'un univers peut afficher : ses textes, et ses libellés essayés au singulier et au pluriel. */
function tousLesTextes(t: TextesUnivers): string[] {
  const l = t.libelles;
  const out: string[] = [...Object.values(t.especes), l.dejaFait, l.etoiles, ...Object.values(t.baleine.arrivee)];
  for (const g of Object.values(t.gardiens)) out.push(g.challenge, g.guardianSays.hit, g.guardianSays.miss, g.guardianSays.beaten);
  for (const n of [1, 2]) {
    out.push(l.etoilesSur3(n), l.resistance(n, 3), l.encoreAFaire(n), l.navireAttend(n), l.faitsSur(n, 6), l.progres(n, 28));
    out.push(l.navireGardiens(n, 2, t.archipels['6e'], 'la voile'), l.navireGardiens(0, n, t.archipels['6e'], 'la voile'));
  }
  out.push(l.dejaFaitArene('Le Grand Chêne'), t.baleine.gardiens(t.archipels['6e']), t.baleine.port('Plaine des nombres'), t.baleine.ouvrage('Mine des lettres'));
  out.push(l.defiPret, l.defiPretCourt, l.defiFerme('Le Grand Chêne', 2), l.arene('le Grand Chêne'));
  out.push(l.decouverteOuvrages, l.decouverteNavire);
  out.push(...Object.values(t.archipels), ...Object.values(t.roles));
  for (const s of Object.values(t.succes)) if (s) out.push(s.title, s.description);
  for (const m of Object.values(t.monuments)) if (m) out.push(...Object.values(m));
  if (t.renommage) out.push(t.renommage.titre, t.renommage.intro, ...t.renommage.lignes, t.renommage.bouton);
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
    // changé dans Blocland la change. Les libellés sont écrits en entier ci-dessous ; le mot des grandes étapes, les noms
    // des archipels et des rôles, que GD-1 a changés, ont leurs propres cas plus bas. Trois
    // exceptions voulues : la réplique d'échec du Dragon de lumière (« relis la formule ou le graphique »), changée avec
    // les Faisceaux, dont les manches de graphique ne se calculent pas (décision du directeur artistique), et celle du
    // Brochet d'argent (« regarde les parts ou l'opération posée »), changée avec « Galets en colonnes », dont les manches
    // d'opérations posées n'ont pas de parts coloriées (décision du directeur artistique), enfin celle du Dragon de cendre
    // (« regarde le tableau ou la droite, rang par rang »), changée avec « Nombres géants » (C-2), dont les manches de
    // grands nombres n'ont pas de virgule (décision du directeur artistique).
    const t = textesDe('blocland');
    // Les îles venues après le lot 6 (le Relais des voyageurs, LV2) n'ont pas de texte « d'avant » : hors de l'empreinte.
    const APRES_LE_LOT_6 = new Set(['relais', 'jardin', 'refuge']);
    const avant = Object.fromEntries(
      BIOMES.filter((b) => !APRES_LE_LOT_6.has(b.id)).map((b) => {
        const g = t.gardiens[b.id];
        return [b.id, { challenge: g.challenge, ...g.guardianSays, species: t.especes[b.id] }];
      }),
    );
    expect(createHash('sha256').update(JSON.stringify(avant)).digest('hex')).toBe('b3577afc0728587b76c52dfc290d094076cf0c659bca850af786367175759431');
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

  it('l’univers choisi s’affiche, Blocland par défaut', () => {
    expect(universAffiche(undefined)).toBe('blocland');
    expect(universAffiche('blocland')).toBe('blocland');
    expect(universAffiche('archipeo')).toBe('archipeo');
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

  it('le mot des grandes étapes : les mêmes étapes dans les deux univers', () => {
    const guardians = Object.fromEntries(BIOMES.filter((b) => b.classe === '6e').map((b) => [`${b.id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
    const moments = reachedWhaleMoments(sanitizeState({ progress: guardians }), '6e');
    const gardiens = moments.find((m) => m.kind === 'gardiens');
    if (!gardiens) throw new Error('étape « gardiens » non atteinte');
    expect(pagesBaleine(gardiens, textesDe('blocland'))).toEqual(['Tous les Gardiens des Basses Terres sont vaincus ! Leurs statues gardent maintenant ton chantier.']);
    expect(pagesBaleine(gardiens, textesDe('archipeo'))).toEqual(['Tous les Gardiens des Premiers Rivages brillent à nouveau. J’ai vu leur lumière depuis le large.']);
    // La bulle pratique sur le navire suit la phrase d'arrivée, dans les deux univers (rien en 6e, où l'on commence).
    for (const a of ARCHIPELAGOS) {
      const arrivee = { id: `archipel-${a.classe}`, kind: 'arrivee' as const, archipelago: a.classe, island: a.port };
      for (const u of UNIVERS) expect(pagesBaleine(arrivee, textesDe(u))).toHaveLength(a.classe === '6e' ? 1 : 2);
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
    expect([d.compte(2, 7), d.seuil(5, false), d.seuil(5, true)]).toEqual(['2 sur 7', 'Il faut 5 épreuves réussies pour rallumer sa lumière.', 'C’est assez pour rallumer sa lumière.']);
    expect([d.jaugeLue(1, 7, 5), d.jaugeLue(2, 7, 5)]).toEqual(['1 épreuve réussie sur 7, il en faut 5', '2 épreuves réussies sur 7, il en faut 5']);
    expect(d.rallume('Le Grand Chêne')).toBe('Le Grand Chêne brille à nouveau.');
    expect(tousLesTextes(t).join('\n')).not.toMatch(/bâtisseur|affront|arène/);
    const neufs = [t.libelles.defiPret, t.libelles.defiPretCourt, t.libelles.defiFerme('Le Grand Chêne', 2), d.consigne, d.seuil(5, true)];
    expect(neufs.join('\n')).not.toMatch(/!/);
    // « brille à nouveau » : au village et à la baleine seulement.
    for (const g of Object.values(t.gardiens)) expect(Object.values(g.guardianSays).join()).not.toMatch(/à nouveau/);
  });
});

describe('les textes communs (J8, U4)', () => {
  it('les répliques des créatures sont celles d’avant, plus les répliques ajoutées par les lots de contenu, dans les deux univers', () => {
    // L'empreinte des répliques telles qu'elles étaient dans biomes.ts avant U4 (île par île : greeting, lines, home),
    // avec la réplique d'Astra des Voix des textes (#203), celle de Kroa du Gué des temps (#230), celle de Cléa de l’Écho des pronominaux (#238), celle de Fi des Faisceaux (#247), celle de Bloquette du Troupeau (C-3), celle de Rouxel des Facettes (C-6),
    // celle de Nénu de « Galets en colonnes » (C-1) et celle de Lavi de « Nombres géants » (C-2).
    // Quand un univers aura ses propres répliques, l'empreinte ne vaudra plus que pour Blocland.
    for (const u of UNIVERS) {
      const t = textesDe(u);
      // Les îles venues après U4 (le Jardin des heures, LV2-4 ; le Refuge des carnets, LV2-5) n'ont pas de réplique « d'avant » : hors de l'empreinte.
      const r = Object.fromEntries(BIOMES.filter((b) => b.id !== 'jardin' && b.id !== 'refuge').map((b) => [b.id, t.creatures[b.id]]));
      expect(createHash('sha256').update(JSON.stringify(r)).digest('hex')).toBe('ee5d7b2fcc1a7a49749e0a41c5077b279215383439d33d63e023e6b85b618ccf');
    }
  });

  it('les états d’île : Archipéo restaure ses îles, Blocland les bâtit ; les trois autres mots sont communs', () => {
    const communs = { fermee: 'Fermée', 'a-explorer': 'À explorer', 'en-chantier': 'En chantier' };
    expect(textesDe('archipeo').etatsDIle).toEqual({ ...communs, restauree: 'Restaurée' });
    expect(textesDe('blocland').etatsDIle).toEqual({ ...communs, restauree: 'Bâtie' });
  });
});

describe('GD-1 : le chantier du bâtisseur, dans Blocland seulement', () => {
  const arrivee = (a: (typeof ARCHIPELAGOS)[number]): WhaleMoment => ({ id: `archipel-${a.classe}`, kind: 'arrivee', archipelago: a.classe, island: a.port });

  it('Archipéo garde ses textes d’avant GD-1, sans un mot changé', () => {
    const t = textesDe('archipeo');
    expect(t.baleine.parle).toBe('baleine');
    expect(t.baleine.arrivee).toEqual({
      '6e': 'Je suis la baleine. Je passe au large quand tu fais quelque chose de grand.',
      '5e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles Brumeuses : six îles, et les mêmes règles.',
      '4e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Anciens Ateliers : les vieux ateliers attendent qu’on les remette en marche.',
      '3e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles du Ciel : ici, les îles flottent dans les nuages.',
    });
    expect([t.baleine.port('Plaine des nombres'), t.baleine.ouvrage('Mine des lettres')]).toEqual([
      'Plaine des nombres est bâtie. Tu avances bien : chaque île bâtie rend l’archipel plus beau.',
      'Un chemin s’ouvre vers Mine des lettres. L’archipel s’agrandit.',
    ]);
    // Les noms des archipels et des rôles sont ceux des données ; aucun succès renommé, aucun écran de renommage.
    expect(t.archipels).toEqual(NOMS_ARCHIPELS);
    expect(t.archipels).toEqual({ '6e': 'Premiers Rivages', '5e': 'Îles Brumeuses', '4e': 'Anciens Ateliers', '3e': 'Îles du Ciel' });
    expect(ROLES.map((r) => nomDuRole(t, r.id))).toEqual(['Explorateur', 'Cartographe', 'Bâtisseur', 'Navigateur', 'Architecte de l’archipel']);
    expect(ROLES.map((r) => nomDuRole(t, r.id))).toEqual(ROLES.map((r) => r.name));
    for (const b of BADGES) expect(texteDuSucces(t, b)).toEqual({ title: b.title, description: b.description });
    expect(t.renommage).toBeNull();
    for (const a of ARCHIPELAGOS) {
      expect(quiParle(arrivee(a), t)).toBeNull();
      expect(titreDuMot(arrivee(a), t)).toBe('Le mot de la baleine');
    }
  });

  it('Blocland : les noms d’origine des archipels', () => {
    const t = textesDe('blocland');
    expect(t.archipels).toEqual({ '6e': 'Basses Terres', '5e': 'Collines du Large', '4e': 'Monts de Feu', '3e': 'Îles du Ciel' });
    expect(t.libelles.navireGardiens(1, 3, t.archipels['6e'], 'la voile')).toBe('Gardiens : encore 2 à vaincre dans les Basses Terres pour la voile.');
    // Les monuments qui nommaient un archipel prennent le nom de Blocland, et gardent leur description.
    const moulin = { id: 'monument-moulin', description: 'Un grand moulin.', done: 'Le grand moulin tourne ! Il moud le grain de toutes les îles des Premiers Rivages.' };
    expect(texteDuMonument(t, moulin)).toEqual({ description: 'Un grand moulin.', done: 'Le grand moulin tourne ! Il moud le grain de toutes les îles des Basses Terres.' });
    expect(texteDuMonument(textesDe('archipeo'), moulin)).toEqual({ description: moulin.description, done: moulin.done });
    // Aucun ancien nom d'archipel dans ce que dit Blocland, hors de l'écran qui les annonce.
    expect(tousLesTextes({ ...t, renommage: null }).join('\n')).not.toMatch(/Premiers Rivages|Îles Brumeuses|Anciens Ateliers/);
  });

  it('Blocland : les rôles sont des métiers du chantier, distincts, sans « Bâtisseur »', () => {
    const t = textesDe('blocland');
    const roles = ROLES.map((r) => nomDuRole(t, r.id));
    expect(roles).toEqual(['Apprenti', 'Maçon', 'Mécanicien', 'Ingénieur', 'Architecte']);
    expect(new Set(roles).size).toBe(5);
    expect(roles.join()).not.toMatch(/bâtisseur/i);
    const succes = (id: string) => texteDuSucces(t, BADGES.find((b) => b.id === id)!);
    expect(['rang-argent', 'rang-or', 'rang-diamant', 'rang-legende'].map(succes)).toEqual([
      { title: 'Maçon', description: 'Devenir Maçon : tu poses les blocs bien droits.' },
      { title: 'Mécanicien', description: 'Devenir Mécanicien : tu fais tourner les machines.' },
      { title: 'Ingénieur', description: 'Devenir Ingénieur : tu inventes comment ça marche.' },
      { title: 'Architecte', description: 'Devenir Architecte : tu dessines les plans du village.' },
    ]);
    expect(succes('aeronaute').description).toBe('Gonfler le ballon du Bloc-Navire et rejoindre les Monts de Feu.');
    // Seuls des succès qui existent sont renommés, et leurs identifiants ne changent pas.
    for (const id of Object.keys(t.succes)) expect(BADGES.some((b) => b.id === id)).toBe(true);
  });

  it('Blocland : la créature de l’île-école parle aux grandes étapes, son nom écrit dans le titre', () => {
    const t = textesDe('blocland');
    expect(t.baleine.parle).toBe('ecole');
    expect(ARCHIPELAGOS.map((a) => quiParle(arrivee(a), t)?.creature.name)).toEqual(['Mousso', 'Bazar', 'Ixe', 'Fi']);
    expect(ARCHIPELAGOS.map((a) => titreDuMot(arrivee(a), t))).toEqual(['Le mot de Mousso', 'Le mot de Bazar', 'Le mot d’Ixe', 'Le mot de Fi']);
    expect(pagesBaleine(arrivee(ARCHIPELAGOS[0]), t)).toEqual(['Salut, bâtisseur ! Moi, c’est Mousso, un golem de mousse. Ici, tout se bâtit bloc par bloc, et je t’aide.']);
    expect([t.baleine.port('Plaine des nombres'), t.baleine.ouvrage('Mine des lettres')]).toEqual([
      'Chantier fini : Plaine des nombres ! Bloc après bloc, ton archipel grandit.',
      'Ton ouvrage tient bon ! Nouvelle île ouverte : Mine des lettres.',
    ]);
    expect(tousLesTextes(t).join('\n')).not.toMatch(/baleine/i);
  });

  it('Blocland : l’écran de renommage, une phrase par archipel renommé, un seul bouton', () => {
    const t = textesDe('blocland');
    const r = t.renommage!;
    expect(r.titre).toBe('De nouveaux noms');
    expect(r.bouton).toBe('D’accord');
    const renommes = ARCHIPELAGOS.filter((a) => t.archipels[a.classe] !== a.name);
    expect(r.lignes).toEqual(renommes.map((a) => `Les ${a.name} s’appellent maintenant les ${t.archipels[a.classe]}.`));
  });
});
