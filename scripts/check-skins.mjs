#!/usr/bin/env node
/**
 * Cek kelengkapan skin avatar.
 *
 * Rig toleran: layer INTI wajib ada (kalau tidak, avatar gagal), layer OPSIONAL
 * (sayap/tangan/cloth/aksesoris/dll) boleh hilang → cuma di-skip saat render.
 * Skrip ini membandingkan tiap skin di skins.json terhadap acuan (Roccia, skin
 * lengkap) lalu melaporkan: ✖ bila kurang layer INTI, ⚠ bila cuma kurang opsional.
 *
 * Jalankan:  node scripts/check-skins.mjs
 * Exit code 1 hanya bila ada skin yang kurang layer INTI (berguna utk pre-commit/CI).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIN_DIR = join(ROOT, 'assets', 'avatar', 'hitomi', 'skin');
const SKINS_JSON = join(ROOT, 'assets', 'avatar', 'hitomi', 'skins.json');
const REFERENCE = 'Roccia'; // acuan set file lengkap

// Sinkron dgn REQUIRED_LAYERS di app/src/rig/AvatarRig.ts.
const REQUIRED = [
  '7_body.png',
  '8_headbase.png',
  '9b_mouth_closed.png',
  '10_eyes_background.png',
  '10_eyes_pupil_left.png',
  '10_eyes_pupil_right.png',
  '10_eyes_frame.png',
];

const pngs = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort() : null;

const refFiles = pngs(join(SKIN_DIR, REFERENCE));
if (!refFiles) {
  console.error(`✖ Skin acuan "${REFERENCE}" tak ditemukan di ${SKIN_DIR}`);
  process.exit(1);
}
const refSet = new Set(refFiles);

// Ambil daftar skin dari skins.json (fallback: semua subfolder skin/).
let ids;
try {
  ids = JSON.parse(readFileSync(SKINS_JSON, 'utf8')).skins.map((s) => s.id);
} catch {
  ids = readdirSync(SKIN_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

console.log(`Acuan: ${REFERENCE} (${refFiles.length} file)\n`);
let hasMissing = false;

for (const id of ids) {
  const files = pngs(join(SKIN_DIR, id));
  if (files === null) {
    console.log(`✖ ${id}: folder skin/${id}/ tidak ada`);
    hasMissing = true;
    continue;
  }
  const set = new Set(files);
  const missing = refFiles.filter((f) => !set.has(f));
  const extra = files.filter((f) => !refSet.has(f));
  const coreMissing = REQUIRED.filter((f) => !set.has(f));
  const optMissing = missing.filter((f) => !REQUIRED.includes(f));

  if (id === REFERENCE) {
    console.log(`● ${id}: acuan (${files.length} file)`);
    continue;
  }
  if (coreMissing.length) {
    hasMissing = true;
    console.log(`✖ ${id}: KURANG ${coreMissing.length} layer INTI (avatar gagal) (${files.length}/${refFiles.length}):`);
    for (const f of coreMissing) console.log(`    - ${f}  [inti]`);
    if (optMissing.length) console.log(`    (+${optMissing.length} opsional juga belum ada)`);
  } else if (optMissing.length) {
    console.log(`⚠ ${id}: inti lengkap, ${optMissing.length} opsional belum ada (di-skip saat render):`);
    for (const f of optMissing) console.log(`    - ${f}`);
  } else {
    const extraNote = extra.length ? `  (+${extra.length} ekstra)` : '';
    console.log(`✔ ${id}: lengkap (${files.length}/${refFiles.length})${extraNote}`);
  }
  if (extra.length && (coreMissing.length || optMissing.length)) {
    console.log(`    (ekstra tak terpakai: ${extra.join(', ')})`);
  }
}

console.log('');
process.exit(hasMissing ? 1 : 0);
