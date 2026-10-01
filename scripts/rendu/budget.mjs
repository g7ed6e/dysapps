// Le budget de rendu d'Archipéo, poste par poste : `npm run rendu:budget` donne, pour chaque archipel tout construit,
// les triangles et les appels de dessin que compte chaque poste (src/blocland/world/budget.ts, les mêmes fonctions que
// world/budget.test.ts), son enveloppe et la marge qui reste. Sans navigateur ni Three.js : quelques secondes, pour
// chiffrer un lot avant et après sans écrire de test jetable. Le poste « Dans la scène » (étiquettes, flèche, fanion,
// balises) ne se compte que dans le navigateur : `npm run rendu:mesures` mesure la scène entière.
// `--archipel 6e,3e` : seulement ces archipels ; `--json` : les chiffres en JSON, pour un script.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
const option = (nom) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const JSON_SEUL = args.includes('--json');

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const load = (p) => server.ssrLoadModule(p);
  const [budget, { ARCHIPELAGO_IDS }] = await Promise.all([load('/src/blocland/world/budget.ts'), load('/src/blocland/world/map.ts')]);
  const demandes = option('--archipel')?.split(',');
  const inconnus = demandes?.filter((a) => !ARCHIPELAGO_IDS.includes(a)) ?? [];
  if (inconnus.length) throw new Error(`Archipel inconnu : ${inconnus.join(', ')} (${ARCHIPELAGO_IDS.join(', ')})`);
  const archipels = ARCHIPELAGO_IDS.filter((a) => !demandes || demandes.includes(a));

  // Les postes que le code compte, avec la fonction que vérifie world/budget.test.ts.
  const COUTS = {
    sol: budget.solCost,
    mer: budget.merCost,
    faune: budget.fauneCost,
    decor: budget.decorCost,
    construction: budget.constructionCost,
    bornes: budget.bornesCost,
    navire: budget.navireCost,
  };
  const resultats = archipels.map((a) => {
    const personnages = budget.personnagesCost(a);
    const postes = Object.keys(budget.ENVELOPPES).map((poste) => {
      const enveloppe = budget.enveloppeDe(poste, a);
      const mesure = COUTS[poste]?.(a) ?? personnages[poste] ?? null;
      return { poste, nom: budget.ENVELOPPES[poste].nom, mesure, enveloppe };
    });
    const comptes = postes.filter((p) => p.mesure);
    const somme = (cle, liste) => liste.reduce((n, p) => n + p[cle], 0);
    return {
      archipel: a,
      postes,
      // La somme des postes comptés, et celle de leurs enveloppes (sans « Dans la scène »).
      total: {
        mesure: { triangles: somme('triangles', comptes.map((p) => p.mesure)), drawCalls: somme('drawCalls', comptes.map((p) => p.mesure)) },
        enveloppes: { triangles: somme('triangles', comptes.map((p) => p.enveloppe)), drawCalls: somme('drawCalls', comptes.map((p) => p.enveloppe)) },
      },
      plafond: budget.RENDER_BUDGET,
    };
  });

  if (JSON_SEUL) console.log(JSON.stringify(resultats, null, 2));
  else {
    const n = (x) => x.toLocaleString('fr-FR');
    for (const r of resultats) {
      console.log(`\n## ${r.archipel}, tout construit\n`);
      console.log('| Poste | Triangles | Enveloppe | Marge | Appels | Enveloppe |');
      console.log('| --- | ---: | ---: | ---: | ---: | ---: |');
      for (const p of r.postes) {
        if (!p.mesure) {
          console.log(`| ${p.poste} | (navigateur) | ${n(p.enveloppe.triangles)} | | | ${p.enveloppe.drawCalls} |`);
          continue;
        }
        const marge = p.enveloppe.triangles - p.mesure.triangles;
        const alerte = marge < 0 || p.mesure.drawCalls > p.enveloppe.drawCalls ? ' ⚠' : '';
        console.log(`| ${p.poste}${alerte} | ${n(p.mesure.triangles)} | ${n(p.enveloppe.triangles)} | ${n(marge)} | ${p.mesure.drawCalls} | ${p.enveloppe.drawCalls} |`);
      }
      const t = r.total;
      console.log(`| **total compté** | **${n(t.mesure.triangles)}** | ${n(t.enveloppes.triangles)} | ${n(t.enveloppes.triangles - t.mesure.triangles)} | **${t.mesure.drawCalls}** | ${t.enveloppes.drawCalls} |`);
      console.log(`\nPlafond des tablettes : ${n(r.plafond.triangles)} triangles, ${r.plafond.drawCalls} appels (objectif du plan, jamais mesuré sur tablette).`);
    }
  }
} finally {
  await server.close();
}
