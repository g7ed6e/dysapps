// Comparer les captures d'un lot à celles de main (`npm run rendu:mesures -- --captures <dossier> --comparer <références>`).
// Les captures sont reproductibles (scripts/prise-de-vue.mjs, horloge pilotée) : deux prises du même état ne diffèrent
// que de quelques pixels. Une vue qui diffère de plus de `SEUIL` est « changée » : sa planche avant/après (le nom de la
// vue écrit dessus, l'avant à gauche, l'après à droite, à la même échelle) va dans `<dossier>/planches/`. Les autres sont
// listées « inchangées », avec leur écart, dans `<dossier>/comparaison.md`, et ne se publient pas. Le calcul se fait dans
// une page vide du navigateur (canvas) : aucune dépendance de plus. Les vues sans référence (une famille que le lot
// ajoute) vont telles quelles dans `planches/` : elles sont à relire aussi.
// Seul : `node scripts/rendu/comparer.mjs <avant> <après> [<libellé de l'avant>]` (le workflow des captures d'un lot, .github/workflows/captures-lot.yml).
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Part des pixels qui diffèrent au-delà de laquelle une vue est changée : deux prises du même état diffèrent de 0,3 % au
 * plus (seuil demandé par le directeur artistique, 01/10/2026).
 */
export const SEUIL = 0.003;
/** Écart d'un canal (sur 255) au-delà duquel un pixel diffère : la compression JPEG en laisse quelques-uns en dessous. */
const ECART = 24;

/**
 * Compare chaque capture de `apres` à celle du même nom dans `avant` ; écrit les planches des vues changées et
 * `comparaison.md` (`libelle` : ce qu'est l'avant, son dossier par défaut). Rend `{ changees, inchangees, sansAvant }` (noms de fichiers, et part des pixels différents).
 */
export async function comparer(outil, avant, apres, libelle = `\`${avant}\``) {
  const planches = join(apres, 'planches');
  mkdirSync(planches, { recursive: true });
  const changees = [];
  const inchangees = [];
  const sansAvant = [];
  for (const nom of readdirSync(apres).filter((f) => f.endsWith('.jpg')).sort()) {
    const ref = join(avant, nom);
    if (!existsSync(ref)) {
      sansAvant.push(nom);
      copyFileSync(join(apres, nom), join(planches, nom));
      continue;
    }
    const { part, planche } = await outil.evaluate(
      async ({ a, b, seuil, ecart, titre }) => {
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
        g.fillText(`${titre} · avant (main)`, 12, bandeau / 2);
        g.fillText(`${titre} · après`, ia.width + marge + 12, bandeau / 2);
        return { part, planche: c.toDataURL('image/jpeg', 0.85).split(',')[1] };
      },
      { a: readFileSync(ref).toString('base64'), b: readFileSync(join(apres, nom)).toString('base64'), seuil: SEUIL, ecart: ECART, titre: nom.replace(/\.jpg$/, '') },
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
    `Références : ${libelle}. Une vue est changée au-delà de ${pct(SEUIL)} de pixels différents.`,
    '',
    `## Changées (${changees.length}) : planches dans \`planches/\``,
    '',
    ...changees.map((c) => `- ${c.nom} : ${pct(c.part)}`),
    '',
    `## Inchangées (${inchangees.length}) : non publiées`,
    '',
    ...inchangees.map((c) => `- ${c.nom} : ${pct(c.part)}`),
    ...(sansAvant.length ? ['', `## Sans référence (${sansAvant.length}) : dans \`planches/\` telles quelles`, '', ...sansAvant.map((n) => `- ${n}`)] : []),
    '',
  ];
  writeFileSync(join(apres, 'comparaison.md'), lignes.join('\n'));
  return { changees, inchangees, sansAvant };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [avant, apres, libelle] = process.argv.slice(2);
  if (!avant || !apres) {
    console.error("Usage : node scripts/rendu/comparer.mjs <avant> <après> [<libellé de l'avant>]");
    process.exit(1);
  }
  const { chromium } = await import('playwright-core');
  // Sur la CI, le Chrome déjà installé sur la machine suffit à comparer (`NAVIGATEUR=chrome`) : pas de Chromium à télécharger.
  const browser = await chromium.launch({ channel: process.env.NAVIGATEUR || undefined });
  try {
    const { changees, inchangees, sansAvant } = await comparer(await browser.newPage(), avant, apres, libelle);
    console.log(`${changees.length} changées, ${inchangees.length} inchangées, ${sansAvant.length} sans référence ; détail dans ${join(apres, 'comparaison.md')}.`);
  } finally {
    await browser.close();
  }
}
