// Le budget de rendu d'Archipéo, poste par poste : `npm run rendu:budget` donne, pour chaque archipel tout construit,
// les triangles et les appels de dessin que compte chaque poste (src/game/world/budget.ts, les mêmes fonctions que
// world/budget.test.ts), son enveloppe et la marge qui reste. Sans navigateur ni Three.js : quelques secondes, pour
// chiffrer un lot avant et après sans écrire de test jetable. Le poste « Dans la scène » (étiquettes, flèche, fanion,
// balises) ne se compte que dans le navigateur : `npm run rendu:mesures` mesure la scène entière. En dessous, le monde en
// blocs de Blocland (`sceneCost`), avec et sans les petites constructions des commandes, et les bulles
// (`signesCost`, le même coût quel que soit l'état du jeu), sous son plafond.
// `--archipel 6e,3e` : seulement ces archipels ; `--json` : les chiffres en JSON, pour un script.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
// Deux options seulement ; une option inconnue ou sans valeur arrête le script plutôt que d'être ignorée.
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue;
  if (args[i] === '--archipel' && args[i + 1] && !args[i + 1].startsWith('--')) {
    i++;
    continue;
  }
  console.error(`Option inconnue ou sans valeur : ${args[i]} (--archipel 6e,3e ; --json)`);
  process.exit(1);
}
const option = (nom) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const JSON_SEUL = args.includes('--json');

// Rien que du `ssrLoadModule` : pas de découverte des dépendances, qui écrirait dans node_modules/.vite pendant qu'un
// autre script Vite tourne peut-être dans le même conteneur.
const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const load = (p) => server.ssrLoadModule(p);
  const [budget, { ARCHIPELAGO_IDS }] = await Promise.all([load('/src/game/world/budget.ts'), load('/src/game/world/map.ts')]);
  const demandes = option('--archipel')?.split(',');
  const inconnus = demandes?.filter((a) => !ARCHIPELAGO_IDS.includes(a)) ?? [];
  if (inconnus.length) throw new Error(`Archipel inconnu : ${inconnus.join(', ')} (${ARCHIPELAGO_IDS.join(', ')})`);
  const archipels = ARCHIPELAGO_IDS.filter((a) => !demandes || demandes.includes(a));

  const resultats = archipels.map((a) => {
    const postes = Object.keys(budget.ENVELOPPES).map((poste) => {
      const enveloppe = budget.enveloppeDe(poste, a);
      const mesure = budget.COUTS_DES_POSTES[poste]?.(a) ?? null;
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
      plafond: budget.renderBudgetOf(a),
      // Le monde en blocs de Blocland (`sceneCost`), tout construit, puis avec les petites constructions des commandes
      // posées (GD-7, PR 3), sous son plafond.
      blocs: {
        mesure: budget.sceneCost(a),
        avecCommandes: budget.sceneCost(a, true),
        signes: budget.signesCost(),
        plafond: budget.PLAFOND_DU_MONDE_EN_BLOCS,
        // Le pire cas d'une région aménagée (GD-9) : toutes les liaisons au plus long, les raccourcis, les réunions.
        pire: budget.worstCaseOfRegion(a),
      },
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
      console.log(`\nPlafond des tablettes : ${n(r.plafond.triangles)} triangles, ${r.plafond.drawCalls} appels (objectif du plan, jamais mesuré sur tablette), « Dans la scène » compris, que le total compté laisse de côté.`);
      const b = r.blocs;
      console.log(`\nBlocland, le monde en blocs (\`sceneCost\`) : ${n(b.mesure.triangles)} triangles, ${b.mesure.drawCalls} appels ; avec les petites constructions des commandes posées : ${n(b.avecCommandes.triangles)} triangles (+${n(b.avecCommandes.triangles - b.mesure.triangles)}), ${b.avecCommandes.drawCalls} appels (${b.avecCommandes.drawCalls === b.mesure.drawCalls ? 'aucun de plus' : `+${b.avecCommandes.drawCalls - b.mesure.drawCalls}${b.avecCommandes.drawCalls - b.mesure.drawCalls > 1 ? ' ⚠' : ' : un morceau du monde de plus'}`}) ; plafond ${n(b.plafond.triangles)} triangles, ${b.plafond.drawCalls} appels.`);
      const total = { triangles: b.avecCommandes.triangles + b.signes.triangles, drawCalls: b.avecCommandes.drawCalls + b.signes.drawCalls };
      const depasse = total.triangles > b.plafond.triangles || total.drawCalls > b.plafond.drawCalls ? ' ⚠' : '';
      console.log(`Les bulles (\`signesCost\`) : ${n(b.signes.triangles)} triangles, ${b.signes.drawCalls} appel ; avec le monde en blocs et ses commandes : ${n(total.triangles)} triangles, ${total.drawCalls} appels${depasse}.`);
      const p = b.pire;
      const pireDepasse = p.triangles > b.plafond.triangles || p.drawCalls > b.plafond.drawCalls ? ' ⚠' : '';
      console.log(`Au pire, la région aménagée (GD-9, \`worstCaseOfRegion\`) : ${n(p.triangles)} triangles (${n(p.base)} sans liaisons, ${n(p.liaisons)} de liaisons au plus long, ${n(p.reunions)} de réunions), ${p.drawCalls} appels${pireDepasse}.`);
    }
  }
} finally {
  await server.close();
}
