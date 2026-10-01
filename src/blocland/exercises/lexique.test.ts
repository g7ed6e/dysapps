import { motsAEcouter } from './lexique';

describe('Mots lus par le bouton Écouter d’une ligne de lexique', () => {
  it.each([
    ['push = pousser, pull = tirer ; keep off = ne pas aller sur ; do not = ne pas', 'push, pull, keep off, do not'],
    ['please = s’il te plaît. thank you = merci. sorry = pardon.', 'please, thank you, sorry'],
    ['Hello / Hi = bonjour. Goodbye / Bye = au revoir.', 'Hello, Hi, Goodbye, Bye'],
    ['La date : the third of May = le 3 mai.', 'the third of May'],
    ['past = après : ten past seven = 7 h 10.', 'past, ten past seven'],
    ['to = avant : twenty to four = 4 h moins 20 = 3 h 40.', 'to, twenty to four'],
    ['he = il (un garçon), she = elle (une fille)', 'he, she'],
    ['can = pouvoir, savoir (I can swim). can’t = ne pas pouvoir.', 'can, can’t'],
    ['I don’t understand. = Je ne comprends pas. What does… mean? = Que veut dire… ?', 'I don’t understand, What does mean?'],
    ['Listen to… Look at… = Écoute… Regarde…', 'Listen to, Look at'],
    ['I’d like… = je voudrais…', 'I’d like'],
    ['am = avant midi, pm = après midi : on ajoute 12 (3 pm = 15 h) ; last = dernier', 'a.m., p.m., last'],
  ])('« %s » → « %s »', (ligne, mots) => {
    expect(motsAEcouter(ligne)).toBe(mots);
  });

  it('laisse les précisions entre parenthèses, les mots français et les suffixes', () => {
    expect(motsAEcouter('Faux amis : library = bibliothèque (une librairie = a bookshop) ; pen = stylo')).toBe('library, pen');
    expect(motsAEcouter('Faux ami : college = école après 16 ans ; collège = secondary school.')).toBe('college');
    expect(motsAEcouter('Un nom au singulier (my dog, Tom) = he, she ou it → is.')).toBe('');
    expect(motsAEcouter('-teen = de 13 à 19 (fifteen = 15) ; -ty = les dizaines (fifty = 50)')).toBe('');
  });

  it('ne lit rien d’une ligne de méthode', () => {
    expect(motsAEcouter('Lis d’abord la question, puis cherche dans le document le mot qui répond.')).toBe('');
    expect(motsAEcouter('go → went, see → saw, do → did, eat → ate')).toBe('');
  });
});
