// Le monde en 2D : pixels nets, vue de dessus en oblique (le dessus des cases et les falaises). Même contrat que la
// vue 3D (world/view.ts), même simulation (world/scene.ts) ; le terrain est une carte de tuiles (oblique.ts) dessinée
// par morceaux, d'avance (draw.ts). Chargé à la demande, sans Three.js (voir ./index.ts).
// Étape 2 de la vue 2D : terrain, mer, cadrage, toucher et clavier ; personnages et repères viennent ensuite.
import { useEffect, useRef } from 'react';
import type { BiomeId } from '../biomes';
import { AMBIENCE, palette } from '../world/daylight';
import { faceCanvas } from '../world/pixels';
import { ARROW_DIRS, cubeTags, groundTap, islandInDirection, startVoyage, voyageFrame, type VoyageRun } from '../world/scene';
import { islandCenter } from '../world/terrain';
import { islandsOf } from '../world/archipelago';
import type { WorldViewProps } from '../world/view';
import { drawChunk } from './draw';
import { CHUNK, TILE, buildTiles, frame2D, pickTile, toBase, type TileMap, type View2D } from './oblique';

/** Sous ce niveau, les cubes sont sous la mer : on ne les dessine pas (la mer est un fond animé). */
const SEA_HIDES_BELOW = -1;
/** Morceaux de terrain dessinés au plus par image : le premier affichage reste fluide. */
const CHUNKS_PER_FRAME = 8;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export default function WorldCanvas2D({
  archipelago,
  cubes,
  focus,
  reduceMotion = false,
  vehicle = null,
  voyage = null,
  onVoyageLegEnd,
  onVoyageSkip,
  onPickIsland,
  onPickBridge,
  build,
  map = false,
  home,
  onPickQuest,
  className,
  label,
}: WorldViewProps) {
  const host = useRef<HTMLDivElement>(null);
  // Les gestes et ce qu'ils visent, lus au moment du geste (sans reconstruire la vue).
  const props = useRef({ onPickIsland, onPickBridge, onPickQuest, build, onVoyageLegEnd, onVoyageSkip, map, home, focus: focus.island, archipelago, vehicle });
  props.current = { onPickIsland, onPickBridge, onPickQuest, build, onVoyageLegEnd, onVoyageSkip, map, home, focus: focus.island, archipelago, vehicle };
  const terrain = useRef<{ map: TileMap; chunks: Map<string, HTMLCanvasElement | null>; tags: ReturnType<typeof cubeTags> } | null>(null);
  const view = useRef<View2D | null>(null);
  const voyageRef = useRef<VoyageRun | null>(null);

  // ---- Le terrain : la carte des tuiles, et ses morceaux redessinés à la demande
  useEffect(() => {
    terrain.current = {
      map: buildTiles(cubes, AMBIENCE[archipelago].sky ? -Infinity : SEA_HIDES_BELOW),
      chunks: new Map(),
      tags: cubeTags(cubes),
    };
  }, [cubes, archipelago]);

  // ---- Le cadrage : au premier (ou quand on le redemande d'emblée), d'un coup ; ensuite, la boucle le rejoint en douceur
  useEffect(() => {
    if (focus.seq === 0) view.current = null;
  }, [focus.island, focus.seq]);

  // ---- Le voyage : la 2D ne le dessine pas encore, elle en tient le temps (la page attend sa fin)
  useEffect(() => {
    voyageRef.current = voyage && voyage.seq !== 0 && vehicle ? startVoyage(voyage, performance.now()) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- La scène : le canvas, les gestes, la boucle (une fois par archipel)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.touchAction = 'none';
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ambience = AMBIENCE[archipelago];
    const day = palette(1, archipelago);
    // La mer (ou le plancher de nuages des Îles du Ciel) : sa couleur, et sa texture qui ondule par-dessus.
    const seaTexture = faceCanvas(ambience.sky ? 'nuage' : 'eau', 'top');
    const sea = seaTexture ? ctx.createPattern(seaTexture, 'repeat') : null;
    const seaColor = hex(ambience.sky ? day.sky : day.water);

    const screen = () => ({ w: canvas.width, h: canvas.height });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.max(1, Math.round(el.clientWidth * dpr));
      const h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // Toucher : un tap, pas un glissé.
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pickAt = (e: PointerEvent) => {
      const t = terrain.current;
      const v = view.current;
      if (!t || !v) return null;
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const { bx, by } = toBase(v, screen(), sx, sy);
      return pickTile(t.map, Math.floor(bx / TILE), Math.floor(by / TILE));
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const p = props.current;
      // Pendant le voyage, un tap n'importe où fait arriver tout de suite.
      if (voyageRef.current) return p.onVoyageSkip?.();
      const hit = pickAt(e);
      const t = terrain.current;
      if (!hit || !t) return;
      const tap = groundTap(p.archipelago, hit, t.tags, { quest: Boolean(p.onPickQuest), bridge: Boolean(p.onPickBridge), build: Boolean(p.build) });
      if (tap.kind === 'quest') p.onPickQuest?.(tap.biome, tap.typeId);
      else if (tap.kind === 'bridge') p.onPickBridge?.(tap.id);
      else if (tap.kind === 'face') p.build?.onPickFace(tap.cell, tap.next);
      else p.onPickIsland?.(tap.id);
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      canvas.style.cursor = pickAt(e) ? 'pointer' : 'default';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onHover);

    // Clavier (le cadre prend le focus) : les flèches vont à l'île voisine dans cette direction.
    el.tabIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      const p = props.current;
      if (voyageRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          p.onVoyageSkip?.();
        }
        return;
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir || !p.onPickIsland) return;
      e.preventDefault();
      const here: BiomeId = p.focus ?? p.home ?? islandsOf(p.archipelago)[0].id;
      const next = islandInDirection(p.archipelago, islandCenter(here), dir);
      if (next) p.onPickIsland(next);
    };
    el.addEventListener('keydown', onKey);

    // Économie de batterie : on ne dessine que si le cadre est visible et l'onglet actif.
    let visible = true;
    let running = false;
    let frame = 0;
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((en) => en.isIntersecting);
      if (visible && !running) start();
    });
    seen.observe(el);
    const onVisibility = () => {
      if (!document.hidden && !running) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const t0 = performance.now();
    let last = t0;
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = props.current;
      const tm = terrain.current;
      if (!tm) return;
      const scr = screen();

      // Le temps du voyage (son dessin viendra avec le Bloc-Navire).
      const vy = voyageRef.current;
      if (vy && p.vehicle && voyageFrame(vy, p.vehicle.port, now).end) p.onVoyageLegEnd?.();

      // La caméra rejoint son cadrage en douceur ; le changement d'échelle aussi.
      const target = frame2D({ archipelago: p.archipelago, map: p.map, island: p.focus, home: p.home ?? null }, tm.map, scr);
      const v = view.current;
      if (!v || reduceMotion) view.current = target;
      else {
        const k = 1 - Math.exp(-dt * 3.5);
        v.cx += (target.cx - v.cx) * k;
        v.cy += (target.cy - v.cy) * k;
        v.s += (target.s - v.s) * k;
        if (Math.abs(target.s - v.s) < 0.01) v.s = target.s;
      }
      const cam = view.current!;

      // La mer : sa couleur, et sa texture qui dérive lentement (immobile avec « réduire les animations »).
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = seaColor;
      ctx.fillRect(0, 0, scr.w, scr.h);
      if (sea) {
        const tsec = reduceMotion ? 0 : (now - t0) / 1000;
        const ox = scr.w / 2 - cam.cx * cam.s + tsec * 3 * cam.s;
        const oy = scr.h / 2 - cam.cy * cam.s + tsec * 2 * cam.s;
        ctx.save();
        ctx.globalAlpha = ambience.sky ? 0.5 : 0.35;
        ctx.translate(ox, oy);
        ctx.scale(cam.s, cam.s);
        ctx.fillStyle = sea;
        ctx.fillRect(-ox / cam.s, -oy / cam.s, scr.w / cam.s, scr.h / cam.s);
        ctx.restore();
      }

      // Le terrain : les morceaux visibles, dessinés d'avance, posés sur des pixels entiers (pas de joints).
      const tl = toBase(cam, scr, 0, 0);
      const br = toBase(cam, scr, scr.w, scr.h);
      const size = CHUNK * TILE;
      let drawn = 0;
      for (let cy = Math.floor(tl.by / size); cy <= Math.floor(br.by / size); cy++) {
        for (let cx = Math.floor(tl.bx / size); cx <= Math.floor(br.bx / size); cx++) {
          const k = `${cx},${cy}`;
          if (!tm.map.chunks.has(k)) continue;
          if (!tm.chunks.has(k)) {
            if (drawn >= CHUNKS_PER_FRAME) continue;
            tm.chunks.set(k, drawChunk(tm.map, cx, cy));
            drawn++;
          }
          const img = tm.chunks.get(k);
          if (!img) continue;
          const x0 = Math.round((cx * size - cam.cx) * cam.s + scr.w / 2);
          const y0 = Math.round((cy * size - cam.cy) * cam.s + scr.h / 2);
          const x1 = Math.round(((cx + 1) * size - cam.cx) * cam.s + scr.w / 2);
          const y1 = Math.round(((cy + 1) * size - cam.cy) * cam.s + scr.h / 2);
          ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
        }
      }
    };
    const start = () => {
      last = performance.now();
      loop();
    };
    start();

    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onHover);
      canvas.remove();
      view.current = null;
    };
  }, [archipelago, reduceMotion]);

  return (
    <div ref={host} className={`voxel-canvas pixel-canvas ${className ?? ''}`.trim()} role="img" aria-label={`${label}. Au clavier : les flèches vont à l'île voisine.`} />
  );
}
