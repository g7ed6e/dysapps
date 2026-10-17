/**
 * Typographie française : espace insécable avant ? ! : ; » et après «, pour qu'ils ne restent pas seuls en début de ligne ;
 * entre les tranches de milliers (« 2 000 ») et entre un nombre écrit en chiffres et ce qui le suit (« 66 millions »,
 * « 12 h », « 30 °C », « 50 % »), pour que l'un ne finisse pas une ligne et l'autre ne commence pas la suivante
 * (relecture dys du rivage sud ; `cadrage-contenu.md`). Les sources ne changent pas : l'affichage et la voix s'en chargent.
 */
export function frenchTypography(text: string): string {
  return text
    .replace(/ ([?!:;»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0')
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0')
    .replace(/(\d) (?=[\p{L}%°€])/gu, '$1\u00a0');
}

/**
 * Ce qui ne se coupe pas à l'affichage : un mot composé ou une inversion verbe-pronom, tous leurs traits d'union compris
 * (« taille-crayon », « est-il », « soulève-t-il », « a-t-on », « États-Unis », « J.-C. ») ; la case à compléter « … » avec
 * ce qui lui est collé (« l'… », « d'… », « …s »). Le texte ne change pas (ni trait d'union insécable, ni espace) : la voix
 * et la source lisent le même ; seul l'affichage les garde ensemble (la classe `mot-lie`, global.css).
 */
const KEEP_TOGETHER = /…|(?:\p{Lu}\.-)+\p{Lu}\.|\p{L}+(?:-\p{L}+)+/u;

/**
 * Le morceau gardé va d'une espace sécable à l'autre : la ponctuation et ce qu'une espace insécable lui colle viennent
 * avec lui (« États-Unis. », « «\u00a0est-il\u00a0» »). `mot-lie` est une boîte en ligne (pour qu'un mot plus long que
 * toute la ligne se coupe encore, en dernier recours) : rien ne doit pouvoir passer seul à la ligne à son bord.
 */
const BREAKABLE_SPACE = /([^\S\u00a0\u2007\u202f]+)/u;

/** Le texte en morceaux, dans l'ordre : `keep` pour ceux qui ne se coupent pas à l'affichage (`KEEP_TOGETHER`). */
export function keepTogether(text: string): { text: string; keep: boolean }[] {
  const runs: { text: string; keep: boolean }[] = [];
  for (const [i, part] of text.split(BREAKABLE_SPACE).entries()) {
    if (part === '') continue;
    const keep = i % 2 === 0 && KEEP_TOGETHER.test(part);
    const last = runs[runs.length - 1];
    if (last && !last.keep && !keep) last.text += part;
    else runs.push({ text: part, keep });
  }
  return runs;
}

/**
 * Le mot collé au bout d'un texte et celui collé au début d'un autre (« conduit bien l'» + réponse + «  ? ») : ce qui,
 * autour d'une réponse posée dans la phrase, reste avec elle à l'affichage.
 */
export function gluedEnds(before: string, after: string): { head: string; tail: string; lead: string; rest: string } {
  const tail = /[\S\u00a0\u2007\u202f]*$/u.exec(before)?.[0] ?? '';
  const lead = /^[\S\u00a0\u2007\u202f]*/u.exec(after)?.[0] ?? '';
  return { head: before.slice(0, before.length - tail.length), tail, lead, rest: after.slice(lead.length) };
}
