// Le Worker de Cloudflare qui sert l'application : les fichiers de dist/ sont servis tels quels sans passer par lui
// (wrangler.jsonc, `run_worker_first`) ; il ne reçoit que /api/…, c'est-à-dire la mesure d'usage anonyme
// (src/core/usage.ts). Il vérifie chaque envoi (src/core/usageEvents.ts) et en écrit les évènements dans Workers
// Analytics Engine, sans l'adresse IP ni aucun en-tête de la requête. Le canal (production ou aperçu d'une branche)
// se déduit de l'adresse : la production est servie sous « dysapps.… ».
import { MAX_BYTES, parseUsageBatch, toDataPoint, type DataPoint } from '../core/usageEvents';

/** Ce que Cloudflare donne au Worker (wrangler.jsonc). */
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Le jeu de données de la mesure d'usage ; absent, la mesure est ignorée. */
  USAGE?: { writeDataPoint(point: DataPoint): void };
}

const empty = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function handleUsage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return empty(405);
  // Seulement depuis l'application elle-même (le navigateur pose cet en-tête, un autre site ne peut pas le changer).
  const site = request.headers.get('Sec-Fetch-Site');
  if (site !== null && site !== 'same-origin') return empty(403);
  // `sendBeacon` donne toujours la taille : sans elle, rien n'est lu.
  const declared = request.headers.get('Content-Length');
  if (declared === null) return empty(411);
  if (Number(declared) > MAX_BYTES) return empty(413);
  const text = await request.text();
  if (text.length > MAX_BYTES) return empty(413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return empty(400);
  }
  const batch = parseUsageBatch(raw);
  if (!batch) return empty(400);
  const channel = new URL(request.url).hostname.startsWith('dysapps.') ? 'production' : 'preview';
  for (const event of batch.events) env.USAGE?.writeDataPoint(toDataPoint(batch, event, channel));
  return empty(204);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/usage') return handleUsage(request, env);
    if (pathname.startsWith('/api/')) return empty(404);
    return env.ASSETS.fetch(request);
  },
};
