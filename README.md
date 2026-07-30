# Hitomi-Live 💗

Overlay avatar **PNGtuber 2.5D** yang ngambang di desktop dan **bereaksi ke aktivitas Claude Code**.
Persona **Hitomi** mikir pas kamu kirim prompt, sibuk pas tool jalan, senyum pas sukses, cemberut pas error — plus bubble teks kalimat terakhirnya.

> **Status:** ✅ v1.0.0 · Detail lengkap & keputusan desain di [Master State](docs/Hitomi-Live%20-%20Master%20State.md) · Riwayat di [CHANGELOG](CHANGELOG.md)

---

## Cara kerja

```
Claude Code (hooks) ──► notify.mjs ──► bridge in-process (Rust, :17872) ──► Overlay pixi.js
```

Tiap event Claude Code (`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, …) memicu hook
`notify.mjs` yang POST ke bridge di dalam overlay. Bridge cuma me-relay nama event (validasi ketat,
tak pernah eksekusi apa pun) → avatar berganti ekspresi. **0 token tambahan, tanpa TTS.**

## Fitur v1

- **Overlay mengambang** — frameless, transparan, always-on-top; bisa digeser, resize (menu ukuran 1–10), tembus-klik via tray.
- **Ekspresi reaktif** — idle · mikir · ngoding · sukses · error, dengan mata & mulut yang berganti.
- **Hidup** — kedip, napas, eye/head-tracking ke kursor, rambut & aksesoris goyang (spring-lag), idle emote acak.
- **Animasi "ngomong"** — pas bubble muncul, mata `closed_happy` + mulut buka-tutup; bubble "thinking" berputar saat mikir/ngoding.
- **Mood error** — 1 error → pusing (dizzy), gagal beruntun → kesal (marah).
- **Bubble teks** — kalimat terakhir Hitomi dibaca dari transkrip `.jsonl` (bukan streaming/TTS).
- **Ganti skin** — set tekstur karakter bisa ditukar (lihat [Sistem skin](#sistem-skin)).

## Jalanin (portable)

1. **Build / ambil** `Hitomi Live.exe` (lihat [Build dari sumber](#build-dari-sumber)). Exe self-contained — salin ke mana saja, dobel-klik. Butuh WebView2 (bawaan Windows 11).
2. **Daftarkan hook** biar Claude Code memicu avatar. Portable = daftar **global** sekali di `~/.claude/settings.json`:
   - Salin `hooks/notify.mjs` ke lokasi stabil, mis. `~/.claude/hooks/hitomi-notify.mjs`.
   - Tambah blok `hooks` (contoh untuk `Stop`; ulangi utk `SessionStart`, `UserPromptSubmit`, `PreToolUse`\*, `PostToolUse`\*, `Notification`):
     ```json
     {
       "hooks": {
         "Stop": [
           { "hooks": [ { "type": "command",
             "command": "node \"C:/Users/<you>/.claude/hooks/hitomi-notify.mjs\" Stop" } ] }
         ]
       }
     }
     ```
     \* `PreToolUse`/`PostToolUse` pakai `"matcher": "*"`. Butuh **Node.js** terpasang.
3. Jalankan exe → avatar muncul. Buka project apa pun di Claude Code → dia bereaksi. Matikan exe = avatar diam.

> Persona Hitomi sendiri diaktifkan dengan menaruh `CLAUDE.md` di project (independen dari avatar).

## Build dari sumber

```bash
cd app
npm install
npx tauri dev                    # mode dev (window + hot-reload)
npx tauri build --no-bundle      # -> src-tauri/target/release/app.exe (portable)
```

Ganti icon: taruh PNG persegi lalu `npx tauri icon <file.png>`.

## Sistem skin

Tekstur karakter dipisah per-skin; rig/manifest dipakai bersama (atau di-override per-skin).

```
assets/avatar/hitomi/
  manifest.json          # rig bersama (z-order, pivot, state) — fallback
  skins.json             # daftar skin
  skin/
    Roccia/*.png         # skin default (Wuthering Waves)
    <id>/                # skin lain
      *.png
      manifest.json      # opsional: geometri/pivot khusus skin ini
```

**Tambah skin:** buat folder `skin/<id>/` berisi PNG layer (nama sama), tambah entri di `skins.json`,
lalu `node scripts/check-skins.mjs` untuk cek kelengkapan (layer **inti** wajib, opsional boleh hilang → di-skip).
Ganti skin lewat menu overlay. Aset ke-embed saat build → **rebuild exe** setelah menambah skin.

## Struktur

```
app/        Tauri v2 (Rust) + renderer pixi.js v8 (TypeScript)
assets/     aset seni (avatar/skin, ui, app-icon)
hooks/      notify.mjs — poster event Claude Code -> bridge
scripts/    check-skins.mjs — validasi kelengkapan skin
docs/       Master State (SSOT)
```

## Tech stack

Tauri v2 · pixi.js v8 · TypeScript · bridge Rust in-process (`tiny_http`) · hooks Node.

---

*PNGtuber (bukan Live2D) dipilih karena murah, ringan, tanpa lisensi — dan tanpa TTS keunggulan Live2D hangus. Arsitektur event→state bikin upgrade renderer nanti gampang.*
