# Hitomi-Live — Master State

> SSOT proyek. Auto-baca di awal sesi; update atomik bareng kode.
> **Protokol drift:** kalau dokumen ini berselisih dengan kode/kenyataan — perbaiki dokumen dulu,
> baru kode. Keputusan berubah → entri Decision Log **baru** bertanggal + entri lama ditandai
> *SUPERSEDED* (dicoret, jangan dihapus). Paling rawan drift & wajib dicek tiap sesi:
> **Status · Features · Next Steps**. Aturan lengkapnya di `CLAUDE.md`.

## Overview
Overlay avatar **PNGtuber (2.5D layered)** untuk "menghidupkan" persona Hitomi saat coding.
Avatar tampil sebagai jendela terapung di layar dan bereaksi ke aktivitas agent (Claude Code)
lewat *hooks*. Tujuan: ekspresif & menarik, bukan sekadar teks di terminal.

Konteks pemakaian: user ngoding dengan **Claude Code sebagai ekstensi IDE** — sejak **2026-09-13 di
VS Code** (sebelumnya Antigravity). Overlay sengaja **IDE-agnostic**: sinyalnya datang dari hooks
**global** `~/.claude/settings.json`, bukan API IDE — jadi pindah IDE tak menyentuh kode.

## Status
🟢 **Fase 1a selesai & di-commit.** Renderer pixi.js v8 (Vite+TS) di `app/` (http://127.0.0.1:5173). Loader manifest → scene ber-grup + animasi: blink · eye-track · head-tilt 2.5D · hair-sway · napas · sayap flap · aksesoris baju pendulum · plume kepala trailing. Aset: sayap `1a/1b`, baju `7b`, kepala `15a`(gerak)/`15b`(statis). **Api WebM dibatalkan permanen** (2026-09-12 — aset tak dipakai lagi & sudah tak ada).

🟢 **Fase 1b SELESAI & terverifikasi end-to-end.** WS bridge lokal (`bridge/`, port 17872, `POST /event`→broadcast `WS /ws`), hook poster fire-and-forget (`hooks/notify.mjs`), WS client auto-reconnect di overlay (`app/src/bridge/BridgeClient.ts`) di-wire di `main.ts` — **semua jalan**. Hook terdaftar di `settings.json` & **notif kepanggil beneran di Antigravity (Risiko #1 CLEAR)**.

🟢 **Fase 1c SELESAI — shell overlay Tauri.** Avatar kini **jendela mengambang** di desktop: frameless, transparan, always-on-top (Tauri v2, `app/src-tauri/`). **Tracking kursor global** (`cursor_norm` via `windows` crate) → eye/head-tracking jalan walau **tembus-klik**. **Tray** (Keluar + toggle tembus-klik) + **drag** (`startDragging`) + **menu Hitomi in-app** (ikon flip, panel ungu/pink font Vividly, tombol ukuran 1–10, toggle sisi bubble) + `resize_overlay`. **Fase 1 (ekspresi state) tuntas.**

🟢 **Fase 2 SELESAI — bubble teks.** Hook `Stop` → `notify.mjs` baca transkrip `.jsonl` → kalimat terakhir Hitomi → `POST /bubble` → Rust emit `hitomi://bubble` → overlay tampil bubble (ungu/pink, font Vividly, sisi ikut `bubbleSide`, auto-hilang). **0 token, no TTS.** Ekspresi juga di-boost: `mikir`/`ngoding` mulut random (pout/bleeh, happy1/frawl), flash 1.6s.

🟢 **v1.1.0 (2026-08-02) — karakter orisinal + rig hidup.** Skin **Hitomi orisinal** (maid gothic, telinga kelinci, ahoge, rantai) menggantikan Roccia. Rig jadi **data-driven** (nama layer bebas via `roles`; nomor layer ≥ 8 = grup kepala; opsi per-layer `gain`/`bend`/`deform`/`offset`). **Fisika rambut**: pegas orde-2 + deformasi mesh `MeshPlane` (pangkal diam, ujung melengkung). **Ekspresi lewat pupil** (skala/geser/getar/putar/denyut + tekstur hati & spiral) — eye-tracking **tetap hidup saat berekspresi**, yang tak mungkin di sistem variant-mata lama. **Gerak tangan** (napas + pose saat ngoding). TTS & Live2D dievaluasi lalu dibatalkan (lihat Decision Log).

🟢 **v1.2.0 (2026-08-02) — benar-benar sekali klik.** Exe kini **memasang hook Claude Code sendiri** saat start (`src-tauri/src/hook_setup.rs`): `notify.mjs` ke-bake via `include_str!`, ditulis ke `~/.claude/hooks/`, enam event didaftarkan di `settings.json`. **Non-destruktif** (permissions/model/hook tool lain utuh, backup `.bak`), **idempoten** (path dinormalkan ke `/` supaya tak menulis ulang percuma), **menyembuhkan diri** (path lama diperbarui), dan **gagal dengan tenang** (settings rusak → tak ditimpa). Terverifikasi: dijalankan di mesin yang sudah terpasang → md5 settings **tak berubah**; di config kosong → 6 event terpasang; setelah disisipi config user lain → semuanya tetap utuh. Hitomi melaporkan hasilnya lewat bubble (senang bila baru dipasang, minder bila Node.js tak ada). **Distribusi sejak versi ini: repo `moncrath/Hitomi-Live` PUBLIC**, exe di-commit ke repo + dilampirkan ke GitHub Release (catatan: tiap rebuild menambah ~15MB permanen ke history — rilis berikutnya sebaiknya lewat Release saja).

🟦 **2026-09-13 — FITUR DIBEKUKAN.** User menyatakan sudah nyaman dengan exe portable saat ini; tak ada pekerjaan fitur yang direncanakan. Proyek masuk **mode pemeliharaan**: yang masih berjalan hanya penyetelan aturan & skill di `CLAUDE.md`. Bukan "ditinggalkan" — overlay dipakai harian dan tetap jalan.

## Tech Stack
- **Overlay shell:** ✅ **Tauri v2** (window transparan, frameless, always-on-top; tembus-klik toggle via tray). *(Electron = plan B, tak dipakai.)*
- **Render avatar:** Web + **pixi.js** — sprite berlayer, animasi prosedural.
- **Jembatan event:** ✅ **in-process di overlay (Rust `tiny_http`, port 17872)** — hook POST `/event` → emit event Tauri `hitomi://signal` ke webview. *(Bridge Node `bridge/` kini opsional: cuma buat browser-dev via WS.)*
- **Sumber sinyal:** hooks Claude Code (`settings.json`) → event diskrit.
- **Bubble teks:** baca (tail) transkrip `.jsonl` Claude Code — **0 token tambahan**, no TTS.

## Architecture
```
Claude Code (ekstensi IDE — kini VS Code)
  └─ hooks (settings.json)  ── event ──►  Bridge lokal (WebSocket)  ──►  Overlay PNGtuber (pixi.js)
       - prompt masuk                                                     reaksi:
       - tool dipakai                                                     - ekspresi state
       - selesai / error                                                  - kedip / eye+head tracking / rambut goyang
  └─ transkrip .jsonl ────── tail ──────►  Bridge  ──►  Overlay: bubble teks (kalimat terakhir Hitomi)
```

## Aset seni ✅ (diterima)
Layer PNG di `assets/avatar/hitomi/skin/Hitomi/` (**satu-satunya karakter**; desain & konsep orisinal user,
render gambar dibantu AI (ChatGPT), pemisahan layer + pivot + rig dikerjakan user — lihat Decision Log 2026-09-10), kanvas
seragam **1080×1440**, penamaan bernomor (z besar = atas). Karakter: chibi gothic-lolita, twin-tail ungu-pink.
Rig dipakai dari `skin/Hitomi/manifest.json`; manifest luar = TEMPLATE berdokumentasi untuk karakter baru.
- Base: `1_back-accessories` → `8_headbase` · badan · 2 tangan (di belakang badan) · 3 grup rambut.
- **Mata:** base tracking (`10_eyes_background`+`pupil_left/right`+`frame`) + 7 variant utuh
  (`10a` closed, `10b` closed_happy, `10c` dizzy, `10d` shocked, `10e` angry, `10f` love/yandere, `10g` sad).
- **Mulut:** 9 varian (`9a`–`9i`). **Alis:** statis (`13`,`14`). Poni/rambut samping/aksesoris kepala.
- Manifest resmi + pivot akurat + state/event map: `assets/avatar/hitomi/manifest.json`.
- Template/guide/generator + preview komposit: `assets/avatar/hitomi/_template/`.

## Features
### ✅ Done — Fase 1: Ekspresi State (renderer + bridge + overlay Tauri)
- Map event → ekspresi: idle · mikir · ngoding · sukses (senyum) · error (cemberut/"cemburu").
- Idle liveliness: kedip mata, gerak napas/bob halus.
- Eye-tracking: pupil ikut kursor.
- Head-tracking: tilt + parallax 2.5D ke arah kursor (fake, bukan putar 3D).
- Hair sway: spring/sine physics ikut gerak kepala.

### ✅ Done — Fase 2: Bubble Teks
- Kalimat terakhir Hitomi dari transkrip `.jsonl` → bubble overlay (hook Stop → `/bubble` → `hitomi://bubble`).
- Animasi "ngomong" (mata `closed_happy` + mulut `9aa`/`9ab`), idle emote, mood error (dizzy/marah), bubble "thinking" berputar saat mikir/ngoding.
- Styling: ekor bubble menunjuk ke kepala (ikut sisi kiri/kanan) + animasi muncul pop overshoot; bisa diuji di browser dev lewat tombol DevPanel.

### ✅ Done — Rig data-driven (menggantikan sistem ganti-skin)
- Nama layer bebas per-karakter (`roles`), grup ditentukan nomor layer (≥ 8 = kepala), opsi per-layer `pivot`/`gain`/`bend`/`deform`/`offset`.
- **Pemilih skin DIHAPUS (2026-08-02):** Hitomi jadi satu-satunya karakter. Pilihan skin dulu tersimpan di localStorage — dan localStorage overlay Tauri terpisah dari browser, jadi exe yang pernah dipakai tetap meminta skin lama yang sudah dihapus lalu gagal muat. Tanpa pilihan, tak ada nilai basi yang bisa tertinggal.

### Dibuang — DITUTUP PERMANEN 2026-09-13 (dievaluasi ulang & tetap dibuang, 2026-08-01)
> Ketiganya sudah **mati permanen** atas keputusan user, bukan menunggu waktu. Catatan di bawah disimpan sebagai bukti kenapa, supaya tak ada yang mengusulkannya lagi.
- **TTS / lip-sync** — sempat dibangun & jalan secara teknis (edge-tts + amplitudo→mulut), dicabut: suara tak terdengar di mesin user + ongkos rangkaian tak sepadan.
- **RVC (suara imut)** — butuh venv + torch, dan model `.pth` pihak ketiga (risiko pickle). Batal bersama TTS.
- **Live2D rig** — kerangka renderer siap & lolos build, tapi penghalangnya rigging (kerja tangan di GUI Cubism), bukan kode. **Ditutup permanen 2026-09-13** (dulu "ditunda sampai user belajar rigging" — premis itu gugur, user tak akan memakainya).

## Decision Log → file terpisah
34 entri (Juli 2026–sekarang) ada di **`docs/Hitomi-Live - Decision Log.md`** — sengaja **tidak**
dibaca tiap boot sesi. **Buka file itu sebelum mengangkat ulang keputusan lama, sebelum menambah
entri, atau saat menemukan drift.** Riwayatnya utuh, nol entri dihapus.

Empat terbaru:
- **2026-09-13** — **TTS/RVC & Live2D DITUTUP PERMANEN; status "ditunda tanpa tanggal" dicabut.** User: tak akan memakai keduanya…
- **2026-09-13** — **FITUR DIBEKUKAN: `tauri build` jadi installer & "ekspresi tambahan" DIBATALKAN; portable exe dinyatakan cuku…
- **2026-09-13** — **`anti-slop-skill.md` buatan sendiri DIGANTI `antislop` v3.2.7 (pihak ketiga, MIT). Temuan mengejutkan: yang…
- **2026-09-13** — **IDE pindah Antigravity → VS Code; item "uji end-to-end di sesi coding Antigravity asli" DIHAPUS dari Next St…

## Known Issues / Risks
- ✅ **RESOLVED (2026-07-29):** hooks Claude Code **kepanggil beneran** saat dihost di Antigravity — notif end-to-end terverifikasi jalan. Risiko #1 hilang.
- Head-tracking = efek 2.5D condong/parallax, bukan putar kepala 3D asli (batas PNG flat).

## Next Steps (FITUR DIBEKUKAN — 2026-09-13)
1. ✅ Fase 1 (ekspresi state) · Fase 2 (bubble teks) · skin system · polish bubble · interface renderer · rig data-driven · auto-install hook.
2. **Tak ada pekerjaan fitur yang direncanakan.** Exe portable v1.2.0 dinyatakan **cukup** oleh user. `tauri build` jadi installer & ekspresi tambahan **dibatalkan** (2026-09-13).
3. **Aktivitas yang masih berjalan:** menyetel aturan & skill di `CLAUDE.md` bila user menemukan hal menarik — itu kerja **config**, bukan fitur, dan tak perlu masuk daftar ini.
4. **DITUTUP PERMANEN (2026-09-13):** suara (TTS/RVC) · Live2D. Bukan "ditunda" lagi — user tak akan memakainya. Jangan ditawarkan ulang.
5. **Kalau kelak ada kerja UI lagi:** wajib lewat Gerbang genjutsu + `antislop` (lihat `CLAUDE.md` §9) — aturan itu tetap hidup walau fiturnya beku.

## Catatan lama Next Steps
1. ✅ Aset seni + manifest + state/event map.
2. ✅ Scaffold renderer pixi.js (`app/`) + `npm install` + verifikasi visual (Fase 1a, di-commit).
3. ✅ Scaffold bridge WS + hook poster + client overlay (di-wire di `main.ts`).
4. ✅ Bridge `npm install` + tes end-to-end (`POST /event`→avatar bereaksi) — jalan.
5. ✅ Hook `notify.mjs` terdaftar di `settings.json` + notif kepanggil di Antigravity (Risiko #1 CLEAR).
6. ✅ **Wrap Tauri** — overlay frameless/transparan/always-on-top + tracking global + tray + drag + menu in-app (ukuran 1–10, sisi bubble). **Fase 1 tuntas.**
7. ✅ **Fase 2 — bubble teks:** kalimat terakhir Hitomi dari transkrip `.jsonl` → bubble overlay (sisi ikut toggle). **Selesai.**
8. ✅ **Polish bubble** — ekor + pop animasi, plus tombol dev di DevPanel biar bisa diuji di browser.
9. ❌ **Polish/next — DIBATALKAN 2026-09-13:** ekspresi tambahan · `tauri build` jadi installer. Tak dikerjakan; portable exe dinilai cukup.
   *(item "uji end-to-end di sesi coding Antigravity asli" dihapus 2026-09-13 — pindah ke VS Code; lihat Decision Log.)*

## References
- AIRI — https://github.com/moeru-ai/airi (inspirasi avatar; paket `stage-ui-live2d`, `stage-ui-three`)
- pixi.js — render 2D
