// Vice Coast Cover Studio — make.fun entry program (Node 22).
// Copies the app and the screenshots from this repository into /output and
// writes /output/dossier.json with the kit's buildDossier library.
// Standard library only; no network; deterministic output.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function listFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full));
    else if (entry.isFile()) found.push(full);
  }
  return found.sort();
}

function shotDimensions(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50) {
    // PNG: width/height are big-endian uint32 at offsets 16 and 20.
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    // JPEG: walk segments until a Start Of Frame marker carries the size.
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) fail(`bad JPEG segment in ${file}`);
      const marker = buf[off + 1];
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
      }
      off += 2 + len;
    }
    fail(`no SOF marker in ${file}`);
  }
  fail(`screenshot ${file} is neither PNG nor JPEG`);
}

function validateScreenshots(shotsDir: string, shots: string[]): void {
  for (const name of shots) {
    const file = join(shotsDir, name);
    const bytes = statSync(file).size;
    if (bytes > 262144) fail(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
    const { width, height } = shotDimensions(file);
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);
    if (longSide > 1280) fail(`screenshot ${name} is ${width}x${height}, long side over 1280`);
    if (shortSide < 480) fail(`screenshot ${name} is ${width}x${height}, short side under 480`);
  }
}

function main(): void {
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');

  const shots = readdirSync(shotsDir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => statSync(join(shotsDir, name)).isFile());
  if (shots.length < 3 || shots.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
  validateScreenshots(shotsDir, shots);

  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });

  cpSync(appDir, join(outDir, 'app'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  const appFiles = listFiles(join(outDir, 'app'));
  console.log(`main.ts: copied ${appFiles.length} app files and ${shots.length} screenshots to ${outDir}`);
  console.log(`main.ts: dossier.json is ${readFileSync(join(outDir, 'dossier.json')).length} bytes`);
}

main();
