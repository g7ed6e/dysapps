import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MONDE_OUVERT, produire } from './chemins.mjs';
import { fautes, FORMES, lireMondeOuvert } from './mondeOuvert.mjs';

const BONNES = [
  '- demande : Il me faut {objet}. C’est pour {nom}. Joue une mission {au lieu}.',
  '- demande assemblée : Il me faut {objet}. C’est pour {nom}. Assemble les {blocs} {au lieu}.',
  '- prête : Livre {objet} {au lieu}.',
  '- consigne : Tu livres {objet} pour {nom}.',
  '- posée : {Nom} est en place.',
];
const ENTRAIDE = [
  '- mission : Joue une mission {au lieu}.',
  '- donner : Donne {objet} {au lieu}.',
  '- apporter : Apporte {nom} {au lieu}.',
  '- consigne donner : Tu donnes {objet} pour {nom}.',
  '- consigne apporter : Tu apportes {nom}.',
];
const REVISION = ['- entrée : Tu revois {questions}.', '- fin : Tu as revu {questions}.'];
const md = (...l) => ['# Le monde ouvert', '', '## Les habitants', '', ...l, '', '## L’entraide', '', ...ENTRAIDE, '', '## La révision', '', ...REVISION, ''].join('\n');
const lire = (...l) => () => lireMondeOuvert(md(...l), 'monde-ouvert.md');
const remplacer = (avant, apres) => BONNES.map((l) => (l.startsWith(`- ${avant} :`) ? apres : l));

describe('docs/contenu/monde-ouvert.md', () => {
  it('lit les douze formes de ses trois sections, dans l’ordre du jeu', () => {
    expect(lire(...BONNES)()).toEqual({
      ask: 'Il me faut {objet}. C’est pour {nom}. Joue une mission {au lieu}.',
      askAssembled: 'Il me faut {objet}. C’est pour {nom}. Assemble les {blocs} {au lieu}.',
      ready: 'Livre {objet} {au lieu}.',
      remise: 'Tu livres {objet} pour {nom}.',
      done: '{Nom} est en place.',
      stepMission: 'Joue une mission {au lieu}.',
      stepGive: 'Donne {objet} {au lieu}.',
      stepBring: 'Apporte {nom} {au lieu}.',
      giveRemise: 'Tu donnes {objet} pour {nom}.',
      bringRemise: 'Tu apportes {nom}.',
      revisionEntry: 'Tu revois {questions}.',
      revisionDone: 'Tu as revu {questions}.',
    });
  });

  it('une forme n’est lue que dans sa section ; une section manquante est dite', () => {
    // « donner » écrite sous « Les habitants » : inconnue là.
    expect(lire(...BONNES, ENTRAIDE[1])).toThrow('forme « donner » inconnue dans « Les habitants »');
    const sansRevision = md(...BONNES).replace('## La révision', '## Autre chose');
    expect(() => lireMondeOuvert(sansRevision, 'monde-ouvert.md')).toThrow('la section « ## La révision » manque');
    // L'entrée de la révision ne dit jamais une date ni un échec : ses jetons seuls.
    const daté = md(...BONNES).replace('Tu revois {questions}.', 'Tu revois {questions} du {jour}.');
    expect(() => lireMondeOuvert(daté, 'monde-ouvert.md')).toThrow('jeton « {jour} » inconnu ici');
  });

  it('refuse une forme manquante, inconnue ou écrite deux fois', () => {
    expect(lire(...BONNES.slice(1))).toThrow('la forme « demande » manque');
    expect(lire(...BONNES, '- adieu : Au revoir.')).toThrow('forme « adieu » inconnue');
    expect(lire(...BONNES, BONNES[2])).toThrow('« prête » est écrite deux fois');
    expect(() => lireMondeOuvert('# Rien\n', 'monde-ouvert.md')).toThrow('« ## Les habitants » manque');
  });

  it('garde les jetons de chaque forme : tous, une fois, aucun autre', () => {
    expect(lire(...remplacer('prête', '- prête : Livre les pierres {au lieu}.'))).toThrow('le jeton « {objet} » manque');
    expect(lire(...remplacer('prête', '- prête : Livre les {objet} pour {nom}.'))).toThrow('jeton « {nom} » inconnu ici');
    expect(lire(...remplacer('posée', '- posée : {Nom} est en place, {Nom}.'))).toThrow('écrit deux fois');
    expect(lire(...remplacer('posée', '- posée : {Nom} est {posé}.'))).toThrow('jeton « {posé} » inconnu ici');
  });

  it('refuse une accolade seule, ouverte ou fermée', () => {
    expect(fautes('Livre {objet {au lieu}.', ['objet', 'au lieu']).join()).toMatch(/accolade seule/);
    expect(fautes('Livre {objet} au lieu}.', ['objet', 'au lieu']).join()).toMatch(/accolade seule/);
    expect(fautes('Livre {objet} {au lieu.', ['objet', 'au lieu']).join()).toMatch(/accolade seule/);
    expect(lire(...remplacer('prête', '- prête : Livre {objet} {au lieu.'))).toThrow('accolade seule');
  });

  it('garde les règles de lecture : courtes, calmes, sans mot interdit', () => {
    expect(fautes('Livre les {objet} {au lieu}.', ['objet', 'au lieu'])).toEqual([]);
    expect(fautes('Livre les {objet} {au lieu} !', ['objet', 'au lieu']).join()).toMatch(/ni « ! »/);
    expect(fautes('Livre les {objet} {au lieu}…', ['objet', 'au lieu']).join()).toMatch(/ni « ! », ni « … »/);
    expect(fautes('Livre les {objet} {au lieu}', ['objet', 'au lieu']).join()).toMatch(/un point à la fin/);
    expect(fautes("Livre l'{objet} {au lieu}.", ['objet', 'au lieu']).join()).toMatch(/apostrophe droite/);
    expect(fautes('Merci, livre les {objet} {au lieu}.', ['objet', 'au lieu']).join()).toMatch(/« merci »/);
    expect(fautes('Livre vite les {objet} {au lieu}.', ['objet', 'au lieu']).join()).toMatch(/« vite »/);
    expect(fautes('La quête : livre les {objet} {au lieu}.', ['objet', 'au lieu']).join()).toMatch(/« quête »/);
    expect(fautes('Livre. Les {objet}. Ici. {au lieu}.', ['objet', 'au lieu']).join()).toMatch(/3 phrases au plus/);
    expect(fautes('Livre. Les {objet}. {au lieu}.', ['objet', 'au lieu'])).toEqual([]);
    // Le plafond de mots se compte sur le texte rempli : src/game/three/archipeo/remiseOf.test.ts.
  });

  it('suit docs/contenu/monde-ouvert.md, et le JSON du jeu en est le reflet exact', () => {
    const { sortie } = produire();
    expect(readFileSync(MONDE_OUVERT, 'utf8')).toBe(sortie.get(MONDE_OUVERT));
    expect(Object.keys(JSON.parse(sortie.get(MONDE_OUVERT)))).toEqual(FORMES.map(([, cle]) => cle));
  });
});
