// « Annuler » et ↶ (GD-9) : l'instantané pris à l'entrée dans le mode « Aménager » et la pile des poses.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { freeSpots, linksBrokenBy, moveIsland, relinkBetween, relinkChoices, startingSpot, turnGuardian } from './arrange';
import { canUndo, hasChanged, recordPose, resetToEntry, startArranging, undoLast } from './arrangeSession';
import { toutConstruit } from './budget';

const VOLCAN: BiomeId = 'maths-6e-decimals';

/** Fait une action réussie et l'empile. */
function poser(session: ReturnType<typeof startArranging>, w: World, r: ReturnType<typeof moveIsland>) {
  if (!r.ok) throw new Error(r.reason);
  return { session: recordPose(session, w, r.world), world: r.world };
}

describe('Annuler, et ↶', () => {
  it('↶ défait la dernière pose, puis la précédente ; rien à défaire à l’entrée', () => {
    const w0 = toutConstruit().world;
    let s = startArranging(w0);
    expect(canUndo(s)).toBe(false);
    expect(undoLast(s, w0)).toBeNull();
    const place = freeSpots(w0, VOLCAN).find((p) => p.x !== startingSpot(VOLCAN).x)!;
    const a = poser(s, w0, moveIsland(w0, VOLCAN, place));
    const b = poser(a.session, a.world, turnGuardian(a.world, VOLCAN));
    s = b.session;
    expect(hasChanged(s, b.world)).toBe(true);
    const u1 = undoLast(s, b.world)!;
    expect(u1.world).toEqual(a.world);
    const u2 = undoLast(u1.session, u1.world)!;
    expect(u2.world).toEqual(w0);
    expect(canUndo(u2.session)).toBe(false);
  });

  it('« Annuler » revient à l’entrée, et ↶ le défait', () => {
    const w0 = toutConstruit().world;
    const place = freeSpots(w0, VOLCAN).find((p) => p.x !== startingSpot(VOLCAN).x)!;
    const a = poser(startArranging(w0), w0, moveIsland(w0, VOLCAN, place));
    const b = poser(a.session, a.world, turnGuardian(a.world, VOLCAN));
    const r = resetToEntry(b.session, b.world);
    expect(r.world).toEqual(w0);
    expect(hasChanged(r.session, r.world)).toBe(false);
    expect(undoLast(r.session, r.world)!.world).toEqual(b.world);
    // Rien n'a bougé : rien ne s'empile.
    const rien = resetToEntry(startArranging(w0), w0);
    expect(canUndo(rien.session)).toBe(false);
  });

  it('une liaison reposée revient à l’ancienne ; une liaison payée entre-temps reste', () => {
    const w0 = toutConstruit().world;
    let trouve: { s: ReturnType<typeof freeSpots>[number]; id: string } | null = null;
    for (const turn of [1, 2, 3] as const)
      for (const p of freeSpots(w0, VOLCAN, turn)) {
        const c = linksBrokenBy(w0, VOLCAN, p);
        if (c.length && !trouve) trouve = { s: p, id: c[0] };
      }
    const a = poser(startArranging(w0), w0, moveIsland(w0, VOLCAN, trouve!.s));
    const vers = relinkChoices(a.world, trouve!.id).find((id) => id !== trouve!.id);
    if (!vers) return;
    const b = poser(a.session, a.world, relinkBetween(a.world, trouve!.id, vers));
    expect(b.world.links).toContain(vers);
    // Une liaison payée hors du mode (une autre région) pendant qu'il est ouvert.
    const payee = { ...b.world, links: [...b.world.links, 'passage-inconnu'] };
    const r = resetToEntry(b.session, payee);
    expect(r.world.links).toContain(trouve!.id);
    expect(r.world.links).not.toContain(vers);
    expect(r.world.links).toContain('passage-inconnu');
    expect(r.world.layout).toBeUndefined();
  });
});
