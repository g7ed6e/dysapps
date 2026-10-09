// Lit la mesure d'usage anonyme (src/core/usage.ts) dans Workers Analytics Engine et en fait un résumé en Markdown :
// les lancements par jour, le temps passé et la fluidité par écran, les appareils, les erreurs. Pour le mainteneur
// seulement ; le workflow « Mesure d'usage » (.github/workflows/usage.yml) le lance et l'affiche dans son résumé.
// Il faut deux variables : CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN (un jeton « Account Analytics Read »).
// `node scripts/pilotage/usage.mjs [jours] [canal]` : 30 jours et la production par défaut ; canal « preview » pour les
// aperçus des branches. Les colonnes suivent toDataPoint (src/core/usageEvents.ts).

const DATASET = 'dysapps_usage';
const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 30));
const channel = process.argv[3] === 'preview' ? 'preview' : 'production';
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;

if (!account || !token) {
  console.error('Il manque CLOUDFLARE_ACCOUNT_ID ou CLOUDFLARE_API_TOKEN.');
  process.exit(1);
}

const where = (kind) => `index1 = '${kind}' AND blob5 = '${channel}' AND timestamp > NOW() - INTERVAL '${days}' DAY`;

async function query(sql) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: `${sql} FORMAT JSON`,
  });
  if (!res.ok) throw new Error(`Analytics Engine : ${res.status} ${await res.text()}`);
  return (await res.json()).data;
}

const n = (v, digits = 0) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: digits });

function table(headers, rows) {
  if (rows.length === 0) return '_Rien sur la période._\n';
  return [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n';
}

const DAY = `toStartOfInterval(timestamp, INTERVAL '1' DAY)`;
const [launches, firstFrames, versions, screens, devices, errors] = await Promise.all([
  query(`SELECT ${DAY} AS day, SUM(_sample_interval) AS n, SUM(_sample_interval * double1) / SUM(_sample_interval) AS start
    FROM ${DATASET} WHERE ${where('launch')} GROUP BY day ORDER BY day DESC`),
  query(`SELECT ${DAY} AS day, SUM(_sample_interval * double2) / SUM(_sample_interval) AS first
    FROM ${DATASET} WHERE ${where('launch')} AND double2 > 0 GROUP BY day`),
  query(`SELECT blob2 AS version, blob3 AS universe, blob4 AS view, SUM(_sample_interval) AS n
    FROM ${DATASET} WHERE ${where('launch')} GROUP BY version, universe, view ORDER BY n DESC LIMIT 15`),
  query(`SELECT blob6 AS screen, SUM(_sample_interval) AS visits, SUM(_sample_interval * double1) AS seconds,
    SUM(_sample_interval * double2) AS frames, SUM(_sample_interval * double3) AS frameMs, SUM(_sample_interval * double4) AS slow
    FROM ${DATASET} WHERE ${where('screen')} GROUP BY screen ORDER BY seconds DESC LIMIT 30`),
  query(`SELECT double3 AS width, double4 AS height, double5 AS dpr, blob7 AS mode, SUM(_sample_interval) AS n
    FROM ${DATASET} WHERE ${where('launch')} GROUP BY width, height, dpr, mode ORDER BY n DESC LIMIT 15`),
  query(`SELECT blob7 AS message, blob6 AS screen, blob2 AS version, SUM(_sample_interval) AS n
    FROM ${DATASET} WHERE ${where('error')} GROUP BY message, screen, version ORDER BY n DESC LIMIT 20`),
]);

const first = new Map(firstFrames.map((r) => [r.day, r.first]));
const total = launches.reduce((s, r) => s + Number(r.n), 0);
const out = [
  `# Mesure d'usage, ${days} derniers jours (${channel})\n`,
  `**${n(total)} lancements.** Démarrage : du début du chargement au démarrage du code ; première image : jusqu'à la première image du monde en 3D.\n`,
  '## Lancements par jour\n',
  table(
    ['Jour', 'Lancements', 'Démarrage (ms)', 'Première image (ms)'],
    launches.map((r) => [String(r.day).slice(0, 10), n(r.n), n(r.start), first.has(r.day) ? n(first.get(r.day)) : '—']),
  ),
  '## Versions, univers et vues\n',
  table(['Version', 'Univers', 'Vue', 'Lancements'], versions.map((r) => [r.version, r.universe, r.view, n(r.n)])),
  '## Écrans\n',
  'Images par seconde et part des images lentes (plus de 50 ms) : le monde en 3D seulement.\n',
  table(
    ['Écran', 'Passages', 'Temps total (min)', 'Temps moyen (s)', 'Images/s', 'Images lentes'],
    screens.map((r) => {
      const frames = Number(r.frames);
      return [
        `\`${r.screen}\``,
        n(r.visits),
        n(Number(r.seconds) / 60, 1),
        n(Number(r.seconds) / Number(r.visits)),
        frames > 0 ? n((frames * 1000) / Number(r.frameMs)) : '—',
        frames > 0 ? `${n((100 * Number(r.slow)) / frames, 1)} %` : '—',
      ];
    }),
  ),
  '## Appareils (fenêtre arrondie à 100 px)\n',
  table(['Fenêtre', 'Densité', 'Ouverte', 'Lancements'], devices.map((r) => [`${r.width} × ${r.height}`, r.dpr, r.mode === 'installed' ? 'installée' : 'navigateur', n(r.n)])),
  '## Erreurs\n',
  table(['Message', 'Écran', 'Version', 'Nombre'], errors.map((r) => [r.message.replaceAll('|', '\\|'), `\`${r.screen}\``, r.version, n(r.n)])),
];
console.log(out.join('\n'));
