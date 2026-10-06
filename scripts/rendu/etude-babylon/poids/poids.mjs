import { build } from 'vite';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';
const D = 'scripts/rendu/etude-babylon/poids';
for (const nom of (process.argv[2] ?? 'three,babylon-fin,babylon-index').split(',')) {
  const out = `/tmp/poids-${nom}`;
  rmSync(out, { recursive: true, force: true });
  await build({ configFile: false, logLevel: 'error', build: { outDir: out, minify: true, lib: { entry: join(D, `${nom}.js`), formats: ['es'], fileName: 'x' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
  let brut = 0, gz = 0, br = 0;
  for (const f of readdirSync(out).filter((f) => f.endsWith('.js'))) { const b = readFileSync(join(out, f)); brut += b.length; gz += gzipSync(b).length; br += brotliCompressSync(b).length; }
  console.log(nom, Math.round(brut / 1024), 'Ko min', Math.round(gz / 1024), 'Ko gzip', Math.round(br / 1024), 'Ko brotli');
}
