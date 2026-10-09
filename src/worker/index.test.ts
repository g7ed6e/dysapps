import worker, { type Env } from './index';
import type { DataPoint } from '../core/usageEvents';

function env() {
  const points: DataPoint[] = [];
  const e: Env = {
    ASSETS: { fetch: async () => new Response('page') },
    USAGE: { writeDataPoint: (p) => void points.push(p) },
  };
  return { e, points };
}

const body = JSON.stringify({
  version: '1.42.0',
  universe: 'blocland',
  view: '3d',
  events: [{ kind: 'screen', screen: '/adventure', seconds: 5, frames: 0, frameMs: 0, slowFrames: 0 }],
});

const post = (url: string, init: RequestInit = {}) => {
  const text = typeof init.body === 'string' ? init.body : body;
  return new Request(url, { method: 'POST', ...init, body: text, headers: { 'Content-Length': String(text.length), ...(init.headers as Record<string, string>) } });
};

describe('le Worker', () => {
  it('écrit les évènements d’un envoi, avec le canal de l’adresse', async () => {
    const { e, points } = env();
    const res = await worker.fetch(post('https://dysapps.exemple.workers.dev/api/usage', { headers: { 'Sec-Fetch-Site': 'same-origin' } }), e);
    expect(res.status).toBe(204);
    expect(points.map((p) => p.blobs[4])).toEqual(['production']);
    await worker.fetch(post('https://ma-branche-dysapps.exemple.workers.dev/api/usage'), e);
    expect(points.map((p) => p.blobs[4])).toEqual(['production', 'preview']);
  });
  it('refuse ce qui ne vient pas de l’application ou n’a pas la forme attendue', async () => {
    const { e, points } = env();
    expect((await worker.fetch(post('https://dysapps.x.dev/api/usage', { headers: { 'Sec-Fetch-Site': 'cross-site' } }), e)).status).toBe(403);
    expect((await worker.fetch(new Request('https://dysapps.x.dev/api/usage'), e)).status).toBe(405);
    expect((await worker.fetch(post('https://dysapps.x.dev/api/usage', { body: '{' }), e)).status).toBe(400);
    expect((await worker.fetch(post('https://dysapps.x.dev/api/usage', { body: 'x'.repeat(20_000) }), e)).status).toBe(413);
    expect(points).toEqual([]);
  });
  it('laisse les fichiers à Cloudflare, une autre adresse /api/ n’existe pas', async () => {
    const { e } = env();
    expect(await (await worker.fetch(new Request('https://dysapps.x.dev/'), e)).text()).toBe('page');
    expect((await worker.fetch(new Request('https://dysapps.x.dev/api/autre'), e)).status).toBe(404);
  });
});
