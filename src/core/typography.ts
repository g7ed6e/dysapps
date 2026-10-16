/** Typographie française : espace insécable avant ? ! : ; » et après «, pour qu'ils ne restent pas seuls en début de ligne. */
export function frenchTypography(text: string): string {
  return text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}

/**
 * Ce qui ne se coupe pas à l'affichage : un mot composé ou une inversion verbe-pronom, tous leurs traits d'union compris
 * (« taille-crayon », « est-il », « soulève-t-il », « a-t-on », « États-Unis », « J.-C. ») ; la case à compléter « … » avec ce qui lui est collé (« l'… »,
 * « d'… », « …s »). Le texte ne change pas (ni trait d'union insécable, ni espace) : la voix et la source lisent le même ;
 * seul l'affichage les garde ensemble (un conteneur `white-space: nowrap`, la classe `mot-lie`).
 */
const KEEP_TOGETHER = /(\S*…\S*|(?:\p{Lu}\.-)+\p{Lu}\.|\p{L}+(?:-\p{L}+)+)/u;

/** Le texte en morceaux, dans l'ordre : `keep` pour ceux qui ne se coupent pas à l'affichage (`KEEP_TOGETHER`). */
export function keepTogether(text: string): { text: string; keep: boolean }[] {
  return text
    .split(KEEP_TOGETHER)
    .map((part, i) => ({ text: part, keep: i % 2 === 1 }))
    .filter((p) => p.text !== '');
}

/**
 * Le mot collé au bout d'un texte et celui collé au début d'un autre (« conduit bien l'» + réponse + «  ? ») : ce qui,
 * autour d'une réponse posée dans la phrase, reste avec elle à l'affichage.
 */
export function gluedEnds(before: string, after: string): { head: string; tail: string; lead: string; rest: string } {
  const tail = /\S*$/u.exec(before)?.[0] ?? '';
  const lead = /^\S*/u.exec(after)?.[0] ?? '';
  return { head: before.slice(0, before.length - tail.length), tail, lead, rest: after.slice(lead.length) };
}
