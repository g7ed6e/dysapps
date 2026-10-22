// Le budget de rendu d'Archipéo, poste par poste : `npm run rendu:budget` donne, pour chaque archipel tout construit,
// les triangles et les appels de dessin que compte chaque poste (src/game/world/budget.ts, les mêmes fonctions que
// world/budget.test.ts), son enveloppe et la marge qui reste. Sans navigateur ni Three.js : quelques secondes, pour
// chiffrer un lot avant et après sans écrire de test jetable. Le poste « Dans la scène » (étiquettes, flèche, fanion,
// balises) ne se compte que dans le navigateur : `npm run rendu:mesures` mesure la scène entière. En dessous, le monde en
// blocs de Blocland (`sceneCost`), avec et sans les petites constructions des commandes, et les bulles
// (`signesCost`, le même coût quel que soit l'état du jeu), sous son plafond ; enfin le monde ouvert du 6e et sa Carte
// (`openWorldCost`, `mapCost`, world/continu/budget.ts), puis celui du 5e (`openWorldCost5e`, `mapCost5e`), du 4e
// (`openWorldCost4e`, `mapCost4e`) et du 3e (`openWorldCost3e`, `mapCost3e`), hors de la sortie JSON.
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
  const [budget, { ARCHIPELAGO_IDS }, { loadMonumentsFromDisk }, { loadBuildingsFromDisk }, { loadNefFromDisk }, { chargerLesModelesDuDisque, loadKeoFromDisk }, ouvert, { amenagementsCost }] =
    await Promise.all([
    load('/src/game/world/budget.ts'),
    load('/src/game/world/map.ts'),
    load('/src/game/world/monumentModels.fromDisk.testing.ts'),
    load('/src/game/world/buildingModels.fromDisk.testing.ts'),
    load('/src/game/world/nefModels.fromDisk.testing.ts'),
    load('/src/game/world/characters/imported/fromDisk.testing.ts'),
    load('/src/game/world/continu/budget.ts'),
    load('/src/game/three/archipeo/amenagements.ts'),
  ]);
  // Les monuments et les bâtiments des plans importés d'Archipéo, comme la vue les charge : la construction se compte au
  // pire de leurs chantiers, les bâtiments de près sur une île et de loin ailleurs ; la Nef au pire de ses formes et de ses chantiers.
  loadMonumentsFromDisk();
  loadBuildingsFromDisk();
  loadNefFromDisk();
  // Les personnages importés (de près sur l'île qui coûte le plus, de loin ailleurs) et Kéo dans la tenue de chaque
  // archipel, comme la vue les charge.
  chargerLesModelesDuDisque();
  loadKeoFromDisk();
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
        // La lueur des lanternes allumées, la nuit (GD-10).
        lueurs: budget.lueursCost(a),
        plafond: budget.PLAFOND_DU_MONDE_EN_BLOCS,
        // Le pire cas d'une région aménagée (GD-9) : le lieu soulevé face par face, toutes les liaisons au plus long, les
        // raccourcis, les réunions.
        pire: budget.worstCaseOfRegion(a),
      },
    };
  });

  // Le monde ouvert d'Archipéo (prototype du 6e, derrière le drapeau `?monde=ouvert`) : ses postes (`openWorldCost`) et
  // la Carte de ses lieux (`mapCost`), sous leur enveloppe (`OPEN_WORLD_BUDGETS`), que seul le mainteneur relève ; les
  // aménagements posés (GD-20, point 4), dont la vue trace les dessins, y entrent par leurs triangles.
  const sixieme = !demandes || demandes.includes('6e');
  const amenagements = sixieme ? amenagementsCost().triangles : 0;
  const mondeOuvert = sixieme ? { niveau: '6e', postes: ouvert.openWorldCost(amenagements), carte: ouvert.mapCost(amenagements), enveloppe: ouvert.OPEN_WORLD_BUDGETS['6e'] } : null;
  // Le monde ouvert du 5e (GD-22, lot 2 : toute l'île en grandes masses), sous son enveloppe (`OPEN_WORLD_BUDGETS`, 20
  // octobre 2026 : chaque niveau a la sienne).
  const cinquieme = !demandes || demandes.includes('5e');
  // Au 5e (lot 3), deux cas qui ne se montrent jamais ensemble : la scénette de la Montée ouverte (le pire), puis le
  // monde hors scénette (la pose, la caisse de la cabine qui roule).
  const mondeOuvert5e = cinquieme ? { niveau: '5e', postes: ouvert.openWorldCost5e(), carte: ouvert.mapCost5e(), enveloppe: ouvert.OPEN_WORLD_BUDGETS['5e'], horsScenette: ouvert.openWorldCost5e('monde'), depart: ouvert.openWorldCost5e('depart'), departLibelle: 'la Nef et le mur de nuages dans deux maillages, à la place de la pose' } : null;
  // Le monde ouvert du 4e (lot 1 : l'île entière en grandes masses ; lot 2 : les Fabriques ; lot 3 : l'Épaule, son arche
  // et la Dalle, 73 875 triangles et 17 appels) : comme au 5e, la scénette de la Forge ouverte (le pire), puis le monde
  // hors scénette (la pose ou l'allumage de la Forge), la Carte, le départ.
  const quatrieme = !demandes || demandes.includes('4e');
  const mondeOuvert4e = quatrieme ? { niveau: '4e', postes: ouvert.openWorldCost4e('scenette'), carte: ouvert.mapCost4e(), enveloppe: ouvert.OPEN_WORLD_BUDGETS['4e'], horsScenette: ouvert.openWorldCost4e('monde'), depart: ouvert.openWorldCost4e('depart'), departLibelle: 'l’aéronef et son obstacle dans deux maillages, à la place de la pose' } : null;
  // Le monde ouvert du 3e (lot 1 : les Îles du Ciel en grandes masses) : comme le 4e à son lot 1, le monde (la pose d'un
  // passage, le pire), la Carte, le départ ; pas encore de scénette.
  const troisieme = !demandes || demandes.includes('3e');
  const mondeOuvert3e = troisieme ? { niveau: '3e', postes: ouvert.openWorldCost3e('scenette'), carte: ouvert.mapCost3e(), enveloppe: ouvert.OPEN_WORLD_BUDGETS['3e'], horsScenette: ouvert.openWorldCost3e('monde'), depart: ouvert.openWorldCost3e('depart'), departLibelle: 'l’aéronef dans deux maillages, à la place de la pose' } : null;

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
      const nuit = { triangles: total.triangles + b.lueurs.triangles, drawCalls: total.drawCalls + b.lueurs.drawCalls };
      const nuitDepasse = nuit.triangles > b.plafond.triangles || nuit.drawCalls > b.plafond.drawCalls ? ' ⚠' : '';
      console.log(`La lueur des lanternes allumées, la nuit (\`lueursCost\`) : ${n(b.lueurs.triangles)} triangles, ${b.lueurs.drawCalls} appels ; avec tout ce qui précède : ${n(nuit.triangles)} triangles, ${nuit.drawCalls} appels${nuitDepasse}.`);
      const p = b.pire;
      const pireDepasse = p.triangles > b.plafond.triangles || p.drawCalls > b.plafond.drawCalls ? ' ⚠' : '';
      console.log(`Au pire, la région aménagée (GD-9, \`worstCaseOfRegion\`) : ${n(p.triangles)} triangles (${n(p.base)} sans liaisons, dont ${n(p.choix)} pour le lieu soulevé face par face, ${n(p.liaisons)} de liaisons au plus long, ${n(p.reunions)} de réunions), ${p.drawCalls} appels${pireDepasse}.`);
    }
    for (const monde of [mondeOuvert, mondeOuvert5e, mondeOuvert4e, mondeOuvert3e]) {
      if (!monde) continue;
      const { niveau, postes, carte, enveloppe } = monde;
      console.log(`\n## Le monde ouvert du ${niveau} (prototype, \`?monde=ouvert\`)\n`);
      console.log('| Poste | Triangles | Appels |');
      console.log('| --- | ---: | ---: |');
      for (const p of postes) console.log(`| ${p.poste} | ${n(p.triangles)} | ${p.calls} |`);
      const triangles = postes.reduce((s, p) => s + p.triangles, 0);
      const calls = postes.reduce((s, p) => s + p.calls, 0);
      const alerte = (t, c) => (t > enveloppe.triangles || c > enveloppe.calls ? ' ⚠' : '');
      console.log(`| **total** | **${n(triangles)}** | **${calls}** |`);
      console.log(`\nLe monde : ${n(triangles)} triangles, ${calls} appels${alerte(triangles, calls)} ; la Carte : ${n(carte.triangles)} triangles, ${carte.calls} appels${alerte(carte.triangles, carte.calls)} ; enveloppe ${n(enveloppe.triangles)} triangles, ${enveloppe.calls} appels (que seul le mainteneur relève).`);
      if (monde.horsScenette) {
        const h = monde.horsScenette;
        const ht = h.reduce((s, p) => s + p.triangles, 0);
        const hc = h.reduce((s, p) => s + p.calls, 0);
        const pose = h.find((p) => p.poste === 'pose');
        console.log(`Hors scénette (la pose ou la caisse qui roule à la place de la question et de la scénette) : ${n(ht)} triangles, ${hc} appels${alerte(ht, hc)}${pose ? ` (pose : ${n(pose.triangles)} triangles, ${pose.calls} appel)` : ''}.`);
      }
      if (monde.depart) {
        const d = monde.depart;
        const dt = d.reduce((s, p) => s + p.triangles, 0);
        const dc = d.reduce((s, p) => s + p.calls, 0);
        console.log(`Pendant le départ (${monde.departLibelle}) : ${n(dt)} triangles, ${dc} appels${alerte(dt, dc)}.`);
      }
    }
  }
} finally {
  await server.close();
}
