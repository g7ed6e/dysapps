// Comparer les captures d'un lot à celles de main (`npm run rendu:mesures -- --captures <dossier> --comparer <références>`) :
// les captures sont reproductibles (scripts/prise-de-vue.mjs, horloge pilotée), deux prises du même état ne diffèrent que
// de quelques pixels. Une vue qui diffère de plus de `SEUIL` est « changée » : sa planche avant/après (l'avant à gauche,
// l'après à droite) va dans `<dossier>/planches/`. Les autres sont listées « inchangées » dans `<dossier>/comparaison.md`,
// et ne se publient pas. Le calcul se fait dans une page vide du navigateur (canvas) : aucune dépendance de plus.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Part des pixels qui diffèrent au-delà de laquelle une vue est changée (deux prises du même état : 0,3 % au plus). */
export const SEUIL = 0.005;
/** Écart d'un canal (sur 255) au-delà duquel un pixel diffère : la compression JPEG en laisse quelques-uns en dessous. */
const ECART = 24;

/**
 * Compare chaque capture de `apres` à celle du même nom dans `avant` ; écrit les planches des vues changées et
 * `comparaison.md`. Rend `{ changees, inchangees, sansAvant }` (noms de fichiers, et part des pixels différents).
 */
export async function comparer(outil, avant, apres) {
  const planches = join(apres, 'planches');
  mkdirSync(planches, { recursive: true });
  const changees = [];
  const inchangees = [];
  const sansAvant = [];
  for (const nom of readdirSync(apres).filter((f) => f.endsWith('.jpg')).sort()) {
    const ref = join(avant, nom);
    if (!existsSync(ref)) {
      sansAvant.push(nom);
      continue;
    }
    const { part, planche } = await outil.evaluate(
      async ({ a, b, seuil, ecart }) => {
        const charger = async (b64) => {
          const img = new Image();
          img.src = `data:image/jpeg;base64,${b64}`;
          await img.decode();
          return img;
        };
        const [ia, ib] = await Promise.all([charger(a), charger(b)]);
        const pixels = (img) => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          return g.getImageData(0, 0, c.width, c.height).data;
        };
        let part = 1;
        if (ia.width === ib.width && ia.height === ib.height) {
          const da = pixels(ia);
          const db = pixels(ib);
          let n = 0;
          for (let i = 0; i < da.length; i += 4)
            if (Math.abs(da[i] - db[i]) > ecart || Math.abs(da[i + 1] - db[i + 1]) > ecart || Math.abs(da[i + 2] - db[i + 2]) > ecart) n++;
          part = n / (ia.width * ia.height);
        }
        if (part <= seuil) return { part, planche: null };
        // La planche : l'avant à gauche, l'après à droite, un bandeau de titre au-dessus de chacun.
        const bandeau = 36;
        const marge = 12;
        const c = document.createElement('canvas');
        c.width = ia.width + ib.width + marge;
        c.height = Math.max(ia.height, ib.height) + bandeau;
        const g = c.getContext('2d');
        g.fillStyle = '#1b2433';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(ia, 0, bandeau);
        g.drawImage(ib, ia.width + marge, bandeau);
        g.fillStyle = '#ffffff';
        g.font = 'bold 22px sans-serif';
        g.textBaseline = 'middle';
        g.fillText('Avant (main)', 12, bandeau / 2);
        g.fillText('Après', ia.width + marge + 12, bandeau / 2);
        return { part, planche: c.toDataURL('image/jpeg', 0.85).split(',')[1] };
      },
      { a: readFileSync(ref).toString('base64'), b: readFileSync(join(apres, nom)).toString('base64'), seuil: SEUIL, ecart: ECART },
    );
    if (planche) {
      writeFileSync(join(planches, nom), Buffer.from(planche, 'base64'));
      changees.push({ nom, part });
    } else inchangees.push({ nom, part });
  }
  const pct = (p) => `${(p * 100).toFixed(1).replace('.', ',')} %`;
  const lignes = [
    `# Comparaison avec main`,
    '',
    `Références : \`${avant}\`. Une vue est changée au-delà de ${pct(SEUIL)} de pixels différents.`,
    '',
    `## Changées (${changees.length}) : planches dans \`planches/\``,
    '',
    ...changees.map((c) => `- ${c.nom} : ${pct(c.part)}`),
    '',
    `## Inchangées (${inchangees.length}) : non publiées`,
    '',
    ...inchangees.map((c) => `- ${c.nom} : ${pct(c.part)}`),
    ...(sansAvant.length ? ['', `## Sans référence (${sansAvant.length}) : à publier telles quelles`, '', ...sansAvant.map((n) => `- ${n}`)] : []),
    '',
  ];
  writeFileSync(join(apres, 'comparaison.md'), lignes.join('\n'));
  return { changees, inchangees, sansAvant };
}
