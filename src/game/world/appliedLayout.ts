// La disposition de la partie appliquée au monde (GD-9) : à la lecture de la partie et à chaque changement de
// `world.layout`, les lieux sont posés à leur place (`placeIslands(posesOfLayout(layout))`), les liaisons à reposer
// quittent le dessin et les arrivées choisies guident le traceur (`setLinkLayout`). Tout ce qui lit la place d'un lieu
// (terrain, décor, étiquettes, liaisons, caméra, Carte, bornes, Gardien, créature, commandes, grandes constructions)
// la lit ensuite par `islandDef` et les caches de la disposition (`layoutCache`), vidés à chaque changement.
// Code pur, sans Three.js.
import { getBridge } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { posesOfLayout } from './footprint';
import { setLinkLayout } from './linkGeometry';
import { type GuardianPose, layoutVersion, placeFixtures, placeIslands, type Side } from './placement';
import type { BiomeId } from '../biomes';
import type { LinkLandings } from './routing';
import type { Layout, LayoutSide } from './savedLayout';

/** Un côté de la sauvegarde (mot neutre en anglais) dans le repère d'un lieu (./placement.ts). */
export const SIDE_OF: Readonly<Record<LayoutSide, Side>> = { front: 'devant', right: 'droite', back: 'derriere', left: 'gauche' };

/** L'inverse de `SIDE_OF`. */
export const LAYOUT_SIDE_OF: Readonly<Record<Side, LayoutSide>> = { devant: 'front', droite: 'right', derriere: 'back', gauche: 'left' };

/** Les liaisons à reposer et les arrivées choisies d'une disposition, toutes régions confondues. */
function linkLayoutOf(layout: Layout | undefined): { relink: Set<string>; landings: Map<string, LinkLandings> } {
  const relink = new Set<string>();
  const landings = new Map<string, LinkLandings>();
  for (const a of ARCHIPELAGO_IDS) {
    const r = layout?.[a];
    if (!r) continue;
    for (const id of r.relink ?? []) relink.add(id);
    for (const [id, l] of Object.entries(r.landings ?? {}))
      if (getBridge(id)) landings.set(id, { from: { cote: SIDE_OF[l.from.side], pas: l.from.step }, to: { cote: SIDE_OF[l.to.side], pas: l.to.step } });
  }
  return { relink, landings };
}

/** Les Gardiens et les bornes déplacés d'une disposition, toutes régions confondues (leur dessin les lit, ./placement.ts). */
function fixturesOf(layout: Layout | undefined): [Map<BiomeId, GuardianPose>, Map<string, { x: number; y: number }>] {
  const gardiens = new Map<BiomeId, GuardianPose>();
  const bornes = new Map<string, { x: number; y: number }>();
  for (const a of ARCHIPELAGO_IDS) {
    const r = layout?.[a];
    if (!r) continue;
    for (const [id, g] of Object.entries(r.guardians ?? {})) if (g) gardiens.set(id as BiomeId, { side: g.side, step: g.step, turn: g.turn });
    for (const [k, p] of Object.entries(r.stations ?? {})) bornes.set(k, { x: p.x, y: p.y });
  }
  return [gardiens, bornes];
}

/** La dernière disposition appliquée, et le numéro qu'elle a donné : le même objet ne se réapplique pas. */
let applied: { layout: Layout | undefined; version: number } | null = null;

/**
 * Applique au monde la disposition d'une partie (`world.layout`, lue par `sanitizeLayout`) ; `undefined` : la carte de
 * départ. Rien ne change, et les caches restent, si c'est la même disposition. Rend le numéro de la disposition
 * (`layoutVersion`), qui change à chaque changement de place : les vues s'en servent pour se refaire.
 */
export function applyLayout(layout: Layout | undefined): number {
  if (applied && applied.layout === layout && applied.version === layoutVersion()) return applied.version;
  placeIslands(posesOfLayout(layout));
  placeFixtures(...fixturesOf(layout));
  const { relink, landings } = linkLayoutOf(layout);
  setLinkLayout(relink, landings);
  applied = { layout, version: layoutVersion() };
  return applied.version;
}
