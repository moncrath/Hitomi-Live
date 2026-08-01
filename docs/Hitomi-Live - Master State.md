# Hitomi-Live — Master State

> SSOT proyek. Auto-baca di awal sesi; update atomik bareng kode.

## Overview
Overlay avatar **PNGtuber (2.5D layered)** untuk "menghidupkan" persona Hitomi saat coding.
Avatar tampil sebagai jendela terapung di layar dan bereaksi ke aktivitas agent (Claude Code)
lewat *hooks*. Tujuan: ekspresif & menarik, bukan sekadar teks di terminal.

Konteks pemakaian: user ngoding di **Antigravity** dengan **Claude sebagai ekstensi** (= Claude Code
yang jalan, punya hooks). Overlay dibuat **IDE-agnostic** biar nggak tergantung API Antigravity.

## Status
🟢 **Fase 1a selesai & di-commit.** Renderer pixi.js v8 (Vite+TS) di `app/` (http://127.0.0.1:5173). Loader manifest → scene ber-grup + animasi: blink · eye-track · head-tilt 2.5D · hair-sway · napas · sayap flap · aksesoris baju pendulum · plume kepala trailing. Aset: sayap `1a/1b`, baju `7b`, kepala `15a`(gerak)/`15b`(statis). **Api WebM ditunda** (nggak konsisten render, dicabut).

🟢 **Fase 1b SELESAI & terverifikasi end-to-end.** WS bridge lokal (`bridge/`, port 17872, `POST /event`→broadcast `WS /ws`), hook poster fire-and-forget (`hooks/notify.mjs`), WS client auto-reconnect di overlay (`app/src/bridge/BridgeClient.ts`) di-wire di `main.ts` — **semua jalan**. Hook terdaftar di `settings.json` & **notif kepanggil beneran di Antigravity (Risiko #1 CLEAR)**.

🟢 **Fase 1c SELESAI — shell overlay Tauri.** Avatar kini **jendela mengambang** di desktop: frameless, transparan, always-on-top (Tauri v2, `app/src-tauri/`). **Tracking kursor global** (`cursor_norm` via `windows` crate) → eye/head-tracking jalan walau **tembus-klik**. **Tray** (Keluar + toggle tembus-klik) + **drag** (`startDragging`) + **menu Hitomi in-app** (ikon flip, panel ungu/pink font Vividly, tombol ukuran 1–10, toggle sisi bubble) + `resize_overlay`. **Fase 1 (ekspresi state) tuntas.**

🟢 **Fase 2 SELESAI — bubble teks.** Hook `Stop` → `notify.mjs` baca transkrip `.jsonl` → kalimat terakhir Hitomi → `POST /bubble` → Rust emit `hitomi://bubble` → overlay tampil bubble (ungu/pink, font Vividly, sisi ikut `bubbleSide`, auto-hilang). **0 token, no TTS.** Ekspresi juga di-boost: `mikir`/`ngoding` mulut random (pout/bleeh, happy1/frawl), flash 1.6s.

## Tech Stack
- **Overlay shell:** ✅ **Tauri v2** (window transparan, frameless, always-on-top; tembus-klik toggle via tray). *(Electron = plan B, tak dipakai.)*
- **Render avatar:** Web + **pixi.js** — sprite berlayer, animasi prosedural.
- **Jembatan event:** ✅ **in-process di overlay (Rust `tiny_http`, port 17872)** — hook POST `/event` → emit event Tauri `hitomi://signal` ke webview. *(Bridge Node `bridge/` kini opsional: cuma buat browser-dev via WS.)*
- **Sumber sinyal:** hooks Claude Code (`settings.json`) → event diskrit.
- **Bubble teks:** baca (tail) transkrip `.jsonl` Claude Code — **0 token tambahan**, no TTS.

## Architecture
```
Claude Code (di Antigravity)
  └─ hooks (settings.json)  ── event ──►  Bridge lokal (WebSocket)  ──►  Overlay PNGtuber (pixi.js)
       - prompt masuk                                                     reaksi:
       - tool dipakai                                                     - ekspresi state
       - selesai / error                                                  - kedip / eye+head tracking / rambut goyang
  └─ transkrip .jsonl ────── tail ──────►  Bridge  ──►  Overlay: bubble teks (kalimat terakhir Hitomi)
```

## Aset seni ✅ (diterima)
Layer PNG per-skin di `assets/avatar/hitomi/skin/<id>/` (skin aktif: **Roccia** — Wuthering Waves), kanvas
seragam **1080×1440**, penamaan bernomor (z besar = atas). Karakter: chibi gothic-lolita, twin-tail ungu-pink.
Manifest/rig dipakai bersama semua skin; daftar skin di `skins.json`.
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

### ✅ Done — Ganti Skin
- Menu → **Skin**: pilih set tekstur karakter (`skin/<id>/`, data-driven `skins.json`). Skin aktif: **Roccia**. Menyiapkan skin orisinal Hitomi tanpa ubah kode.

### Dibuang (sadar)
- **TTS / lip-sync** — kompleksitas + latency + butuh pipeline audio. (Catatan: TTS TIDAK makan token Claude.)
- **Live2D rig** — keunggulan utamanya (lip-sync halus) nggak kepakai tanpa TTS; ongkos aset/lisensi/berat nggak sepadan.

## Decision Log
- **2026-08-01** — **Pivot: TTS + Live2D (Cubism 5) diadopsi, membatalkan keputusan 2026-07-28.** Alasan pembalikan: keputusan lama menolak Live2D karena "tanpa TTS keunggulannya hangus" — sekarang TTS ikut diambil, jadi premisnya gugur. Cubism 5 juga bawa **AI rigging** di Editor (auto-generate deformer wajah + gerak) yang memangkas ongkos authoring, dan **MotionSync** (audio→mulut) yang menjadikan lip-sync nyaris gratis begitu ada audio. Catatan penting: AI rigging = fitur **Editor**, bukan runtime — ia menyelesaikan ongkos aset, bukan jalur integrasi Claude (hook→event→renderer tetap sama).
- **2026-08-01** — **Lisensi Live2D: aman selama model ke-bake, mahal begitu skin dibuka.** Karakter buatan sendiri tidak dilisensikan Live2D (milik kita); yang berlisensi = SDK/runtime. Untuk **General User / Small-Scale** (penjualan tahunan < ¥10 juta) publikasi bebas biaya **dan tanpa kontrak**, termasuk aplikasi gratis. **TAPI** kategori **"Expandable Application"** (aplikasi yang membolehkan user menambah/menukar model Live2D sendiri — persis sistem skin kita) **tidak punya pengecualian**: kontrak wajib untuk semua ukuran, plus 20% revenue share / $1.91 per penjualan, dan aplikasi gratis "jarang memenuhi syarat". → **Konsekuensi arsitektur: versi publik dikunci ke satu model Hitomi orisinil yang ke-bake di exe; sistem skin data-driven tetap ada tapi jadi fitur versi dev.** (Selaras dengan rencana publik-vs-dev yang sudah ada.) Editor PRO indie ~$100/th (trial 42 hari gratis) — dipakai untuk menilai worth sebelum beli.
- **2026-08-01** — **Strategi branch: refactor & TTS di `main`, Live2D di branch `live2d`.** Alasan: hasil trial Live2D belum pasti, dan branch panjang yang menampung semuanya = rugi total kalau batal / neraka merge kalau jadi. Yang dikerjakan di `main` karena tetap untung apa pun hasilnya: (a) **interface renderer** (`AvatarRenderer` + `PngRenderer`) supaya Live2D nanti cuma implementasi kedua, bukan bedah ulang; (b) **TTS**, yang tak butuh Live2D — amplitudo audio → swap mulut `9a`–`9i` sudah cukup untuk lip-sync kasar di rig PNG, dan pas Live2D masuk tinggal dialihkan ke `ParamMouthOpenY`. Branch `live2d` isinya khusus: Cubism SDK for Web, `Live2DRenderer`, aset `.moc3`+tekstur, MotionSync. **Engine TTS: Piper** (lokal, offline, gratis, tanpa API key) — dipilih ketimbang ElevenLabs karena distribusi kita gratis & portable, API key per-user meracuni rencana itu.
- **2026-07-30** — **Distribusi: 1 exe portable + hook global universal.** `tauri build --no-bundle` = binary self-contained (`target/release/app.exe`, salin bebas, jalan tanpa installer; butuh WebView2 bawaan Win11). Hook dipindah GLOBAL (`~/.claude/settings.json` → `~/.claude/hooks/hitomi-notify.mjs`) supaya avatar portable: **jalankan 1 exe + copy `CLAUDE.md` ke project baru** (persona), avatar auto-bereaksi tanpa daftar hook per-project. Cakupan **universal** (semua sesi Claude Code, apapun persona; matikan exe = avatar diam) — dipilih user ketimbang auto-gate per-Hitomi. Merge non-destruktif (backup `settings.json.bak`, `permissions` utuh); hook per-project repo ini dikosongkan agar tak dobel-fire. Aset avatar ke-bake saat build → skin baru = rebuild exe.
- **2026-07-30** — **Skin fleksibel: manifest per-skin (opsional) + rig toleran.** Karakter beda = bentuk/pivot/z-order beda → tiap skin BOLEH punya `skin/<id>/manifest.json` sendiri (geometri milik skin itu); bila tak ada → fallback ke `manifest.json` bersama (cocok utk recolor/varian sebentuk). Rig kini **toleran**: hanya layer INTI wajib (`7_body`,`8_headbase`,`9b_mouth_closed`, mata base `10_*`); layer opsional (sayap/tangan/cloth/side-hair/bangs/alis/aksesoris/variant mata/mulut ekstra) yang hilang **di-skip** (`Assets.load` per-key + `Promise.all`, bukan `loadBundle` gagal-total), modul animasi terkait di-guard null. Jadi skin boleh beda jumlah file; kurang inti = error jelas. Ganti skin lewat menu → simpan `hitomi.skin` + `reload()` (rebuild rig). Skrip `scripts/check-skins.mjs` bedakan inti (✖) vs opsional (⚠). Loader cek `content-type` (Vite balikin `index.html` 200 utk path tak ada). *(Revisi dari rencana awal "1 manifest bersama" — terlalu kaku utk karakter beda bentuk.)*
- **2026-07-29** — **Bubble teks = kalimat terakhir dari transkrip `.jsonl` (bukan streaming/TTS).** `notify.mjs` pada hook `Stop` baca `transcript_path`, ambil assistant terakhir yang ada teks, strip markdown ringan, ambil kalimat terakhir (cap 180). Endpoint `/bubble` terpisah dari `/event` (teks bebas, validasi longgar tapi di-cap 600 char & 4KB body; ditampilkan via `textContent` → aman). **0 token tambahan.**
- **2026-07-29** — **Ekspresi: mulut random per state via `StateDef.mouths[]`.** `mikir`/`ngoding` tetap mata base (tracking hidup) tapi mulut acak (pout/bleeh, happy1/frawl) biar beda dari idle & terasa hidup. Flash sukses/love 0.9→1.6s.
- **2026-07-29** — **Bridge diserap ke dalam overlay (Rust `tiny_http`), bukan proses Node terpisah.** Tujuan: "launch app → semua jalan" tanpa start manual + jadi 1 exe mandiri (no Node runtime). Rust listen `127.0.0.1:17872/event`, validasi identik bridge Node (kind∈event/state, nama `^[A-Za-z0-9_]+$`≤48, body≤1KB), lalu `emit("hitomi://signal")` ke webview. Frontend: di Tauri pakai `listen()` event Tauri; di browser tetap WS `BridgeClient` (dev). Bind pakai retry 10× (tahan race port saat hot-reload). Node `bridge/` disimpan untuk browser-dev/back-up. **Hook sendiri sudah otomatis (level engine), tak perlu start apa pun.**
- **2026-07-29** — **Overlay Tauri di-bootstrap bertahap (safety-first).** Run pertama window frameless+fullscreen+click-through tanpa tombol close bikin user kejebak → sign out. Aturan baru: mulai dari **window normal (closable)**, verifikasi render/transparansi/tracking, baru nyalakan properti overlay satu-satu **dengan ≥2 tombol darurat** (tray Keluar, taskbar, Alt+F4). Lihat memori `overlay-safe-launch-lesson`.
- **2026-07-29** — **Tracking saat tembus-klik → baca kursor GLOBAL dari Rust.** Overlay click-through = webview tak terima `mousemove`, jadi eye/head-tracking mati. Solusi: command `cursor_norm` (`GetCursorPos`, dinormalisasi -1..1 ke layar) di-poll ~60fps dari frontend; listener DOM pointer dimatikan di Tauri biar tak bentrok.
- **2026-07-29** — **Tembus-klik dikontrol via TRAY, bukan menu in-app.** Toggle di menu bikin overlay ngunci diri (menu ikut tak bisa diklik). Tray selalu bisa dipakai balik → jadi kontrol tunggal yang aman.
- **2026-07-29** — **Resize pakai tombol 1–10, bukan slider.** Slider melompat ke ujung karena tiap `input` me-resize+reposisi window → window gerak di bawah kursor. Grid tombol angka = presisi & bebas efek samping. `resize_overlay` anchor ke tengah (hormati posisi drag), rasio 3:4.
- **2026-07-29** — **Bridge event = relay-nama murni (aman by design).** Bridge cuma broadcast `{kind,name}` yang lolos validasi ketat (regex `^[A-Za-z0-9_]+$`, cap nama 48 char, body 1KB) — **tak pernah eksekusi apa pun**. Hook `notify.mjs` fire-and-forget: timeout 400ms, **selalu exit 0**, jadi Claude Code nggak akan kena blok/gagal walau bridge mati. Client overlay auto-reconnect (backoff 0.4–2.4s) biar tahan putus. Port default `17872`, localhost-only.
- **2026-07-29** — **Api WebM ditunda.** Additive di kanvas transparan bikin kotak hitam → diperbaiki dgn luma-key VP9 alpha, tapi video tetap nggak konsisten nongol di browser user (kemungkinan autoplay/decoder). Diputuskan cabut dulu biar momentum jalan; bisa dihidupkan lagi nanti (aset + pelajaran tersimpan). Renderer tetap siap: tinggal re-add sprite video ke `head`.
- **2026-07-29** — **Aksesoris hidup (Fase 1a+):** (a) `1_back-accessories` dipecah jadi sayap kiri/kanan (`1a`/`1b`), animasi flap idle (sine) + spring-lag asimetris, pivot di titik-tempel bahu. (b) Aksesoris baju jadi layer sendiri (`7a_*`) dengan pendulum halus gain kecil. (c) **Api aksesoris kepala pakai WebM background hitam + `blendMode:'add'`** (bukan sprite sheet / alpha-webm). Alasan: api emissive → additive bikin hitam lenyap & api glowing, authoring paling ringan; jalan di canvas transparan & WebView2 Tauri. `15` dipisah: statik tetap `15`, api = `fire.webm` layer atas.
- **2026-07-28** — Ekspresi via **swap mata utuh (variant)**, bukan alis. Konsekuensi menguntungkan: base eye punya pupil terpisah (tracking aktif); variant eye = pupil baked (beku). Jadi eye-tracking otomatis hanya jalan di state idle/mikir/ngoding, padam mulus saat ekspresi/blink — tanpa pupil nyasar.
- **2026-07-28** — Kanvas seragam 1080×1440 untuk semua layer = registrasi otomatis (tanpa offset manual). Pivot animasi diturunkan dari bbox alpha asli (kepala/leher `534,790`; back-hair `534,255`; twin-tail `380/690,235`; poni `536,300`).
- **2026-07-28** — Adopsi ide avatar dari proyek AIRI (moeru-ai), tapi **tidak** ekstrak kodenya (monorepo coupled + risiko lisensi). Pakai pendekatan/library dasar sendiri.
- **2026-07-28** — Repo **terpisah** dari `Hitomi_Claude` (bukan branch): Hitomi_Claude = template config; Hitomi-Live = app. Beda spesies, jangan campur history.
- **2026-07-28** — Pilih **PNGtuber (2.5D)**, bukan Live2D. Alasan: no TTS → keunggulan Live2D hangus; PNGtuber murah, no lisensi, ringan; arsitektur event→state identik → upgrade ke Live2D nanti cuma ganti renderer.
- **2026-07-28** — Overlay **terapung IDE-agnostic**, bukan dijejalkan ke UI Antigravity (API ekstensinya belum tentu terbuka).
- **2026-07-28** — Scope: Fase 1 (ekspresi state) + Fase 2 (bubble teks). **No TTS.**

## Known Issues / Risks
- ✅ **RESOLVED (2026-07-29):** hooks Claude Code **kepanggil beneran** saat dihost di Antigravity — notif end-to-end terverifikasi jalan. Risiko #1 hilang.
- Head-tracking = efek 2.5D condong/parallax, bukan putar kepala 3D asli (batas PNG flat).

## Next Steps
1. ✅ Aset seni + manifest + state/event map.
2. ✅ Scaffold renderer pixi.js (`app/`) + `npm install` + verifikasi visual (Fase 1a, di-commit).
3. ✅ Scaffold bridge WS + hook poster + client overlay (di-wire di `main.ts`).
4. ✅ Bridge `npm install` + tes end-to-end (`POST /event`→avatar bereaksi) — jalan.
5. ✅ Hook `notify.mjs` terdaftar di `settings.json` + notif kepanggil di Antigravity (Risiko #1 CLEAR).
6. ✅ **Wrap Tauri** — overlay frameless/transparan/always-on-top + tracking global + tray + drag + menu in-app (ukuran 1–10, sisi bubble). **Fase 1 tuntas.**
7. ✅ **Fase 2 — bubble teks:** kalimat terakhir Hitomi dari transkrip `.jsonl` → bubble overlay (sisi ikut toggle). **Selesai.**
8. ✅ **Polish bubble** — ekor + pop animasi, plus tombol dev di DevPanel biar bisa diuji di browser.
9. **Polish/next:** ekspresi tambahan · `tauri build` jadi installer · uji end-to-end di sesi coding Antigravity asli. ← berikutnya

## References
- AIRI — https://github.com/moeru-ai/airi (inspirasi avatar; paket `stage-ui-live2d`, `stage-ui-three`)
- pixi.js — render 2D
- (opsi masa depan) Live2D Cubism Core — kalau upgrade ke rig; catat lisensi proprietary.
