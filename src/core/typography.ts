/** Typographie française : espace insécable avant ? ! : ; » et après «, pour qu'ils ne restent pas seuls en début de ligne. */
export function frenchTypography(text: string): string {
  return text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
