// Étude Babylon.js (branche d'étude, jamais fusionnée) : ouvre le 6e tout construit (vue île et Carte), mesure le rendu
// de l'application telle quelle, puis extrait la scène Three.js (géométries, matrices, matériaux, textures) dans un
// fichier JSON que `banc.html` redessine avec Three.js et avec Babylon.js. `node scripts/rendu/etude-babylon/extraire.mjs <dossier>`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { figeable, hasardFixe, piloterLHorloge, preparerLaScene } from '../../prise-de-vue.mjs';

const OUT = process.argv[2] ?? 'etude-babylon-sortie';
const ARCH = process.argv[3] ?? '6e';
mkdirSync(OUT, { recursive: true });
process.env.NODE_ENV = 'development';
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { port: 5299, strictPort: false, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const load = (p) => server.ssrLoadModule(p);
const [{ BIOMES }, { toutConstruit }] = await Promise.all([load('/src/game/biomes.ts'), load('/src/game/world/budget.ts')]);
const { progress, world: built } = toutConstruit();
const at = BIOMES.find((b) => b.classe === ARCH).id;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

for (const [vue, route] of [['ile', `/adventure/${at}`], ['carte', '/adventure/map']]) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await piloterLHorloge(page, new Date('2026-09-28T10:30:00'));
  await page.addInitScript(hasardFixe);
  await page.addInitScript(figeable);
  await page.goto(`${base}/icon.svg`);
  await page.evaluate(({ world, progress }) => {
    localStorage.clear();
    sessionStorage.setItem('dysapps:title-seen', '1');
    localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: '3d' }));
    localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
    localStorage.setItem('dysapps:region-names', JSON.stringify({ said: true }));
    localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, progress, world }));
    localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 20000, badges: {} }));
  }, { world: { ...built, place: at }, progress });
  await page.goto(`${base}/#/${route.replace(/^\//, '')}`);
  if (!(await preparerLaScene(page, 30000))) throw new Error('pas de monde');
  await page.evaluate(() => window.__dysappsPriseDeVue.figer());
  const dump = await page.evaluate(() => {
    const { scene, camera, renderer } = window.__dysappsScene;
    // 1. L'application telle quelle : temps JS de `renderer.render` (scène et caméra figées).
    const info = renderer.info;
    renderer.render(scene, camera);
    const appli = { calls: info.render.calls, triangles: info.render.triangles };
    const t = [];
    for (let i = 0; i < 120; i++) {
      const t0 = performance.now();
      renderer.render(scene, camera);
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    appli.renderMsMediane = t[60];
    // 2. L'extraction.
    const b64 = (arr) => {
      const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      let s = '';
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(s);
    };
    const geoms = {}, mats = {}, texs = {};
    const attr = (a) => {
      if (!a || a.isInterleavedBufferAttribute) return null;
      const out = new Float32Array(a.count * a.itemSize);
      for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent ? a.getComponent(i, k) : a.array[i * a.itemSize + k];
      return { size: a.itemSize, data: b64(out) };
    };
    const geom = (g) => {
      if (geoms[g.uuid]) return g.uuid;
      const idx = g.index ? new Uint32Array(Array.from(g.index.array)) : null;
      geoms[g.uuid] = {
        position: attr(g.attributes.position), normal: attr(g.attributes.normal), uv: attr(g.attributes.uv), color: attr(g.attributes.color),
        index: idx ? b64(idx) : null, groups: g.groups.map((x) => ({ start: x.start, count: x.count, mi: x.materialIndex ?? 0 })),
        drawCount: g.drawRange.count,
      };
      return g.uuid;
    };
    const tex = (tx) => {
      if (!tx) return null;
      if (texs[tx.uuid]) return tx.uuid;
      const img = tx.image;
      let url = null;
      try {
        if (img && img.width) {
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          c.getContext('2d').drawImage(img, 0, 0);
          url = c.toDataURL('image/png');
        }
      } catch { url = null; }
      texs[tx.uuid] = { url, nearest: tx.magFilter === 1003, repeat: [tx.repeat.x, tx.repeat.y] };
      return tx.uuid;
    };
    const mat = (m) => {
      if (mats[m.uuid]) return m.uuid;
      mats[m.uuid] = {
        type: m.type, color: m.color ? m.color.getHex() : 0xffffff, emissive: m.emissive ? m.emissive.getHex() : 0,
        map: tex(m.map), transparent: m.transparent, opacity: m.opacity, vertexColors: m.vertexColors, side: m.side,
        depthWrite: m.depthWrite, shaderPatch: Boolean(m.onBeforeCompile && m.onBeforeCompile.toString().length > 20),
      };
      return m.uuid;
    };
    const objets = [];
    const autres = {};
    scene.updateMatrixWorld(true);
    scene.traverseVisible((o) => {
      if (o.isMesh && o.geometry?.attributes?.position && !o.geometry.attributes.position.isInterleavedBufferAttribute) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        const ob = { name: o.name, parent: o.parent?.name ?? '', geom: geom(o.geometry), mats: ms.map(mat), matrix: o.matrixWorld.toArray(), renderOrder: o.renderOrder, frustumCulled: o.frustumCulled };
        if (o.isInstancedMesh) {
          ob.instances = b64(new Float32Array(o.instanceMatrix.array.slice(0, o.count * 16)));
          ob.count = o.count;
          if (o.instanceColor) ob.instanceColor = b64(new Float32Array(o.instanceColor.array.slice(0, o.count * 3)));
        }
        objets.push(ob);
      } else if (o.isMesh || o.isLine || o.isPoints || o.isSprite) {
        autres[o.type] = (autres[o.type] ?? 0) + 1;
      }
    });
    camera.updateMatrixWorld();
    const lights = [];
    scene.traverseVisible((o) => { if (o.isLight) lights.push({ type: o.type, color: o.color.getHex(), intensity: o.intensity, pos: o.position.toArray(), ground: o.groundColor?.getHex() }); });
    return {
      appli,
      camera: { pos: camera.position.toArray(), quat: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect, near: camera.near, far: camera.far },
      background: scene.background?.isColor ? scene.background.getHex() : 0x88c8f0,
      fog: scene.fog ? { color: scene.fog.color.getHex(), near: scene.fog.near, far: scene.fog.far, density: scene.fog.density } : null,
      lights, objets, geoms, mats, texs, autres,
    };
  });
  writeFileSync(join(OUT, `${ARCH}-${vue}.json`), JSON.stringify(dump));
  console.log(vue, JSON.stringify(dump.appli), 'objets', dump.objets.length, 'géométries', Object.keys(dump.geoms).length, 'matériaux', Object.keys(dump.mats).length, 'textures', Object.keys(dump.texs).length, 'non extraits', JSON.stringify(dump.autres));
  await page.close();
}
await browser.close();
await server.close();
