# Hitomi-Live — Master State

> SSOT proyek. Auto-baca di awal sesi; update atomik bareng kode.

## Overview
Overlay avatar **PNGtuber (2.5D layered)** untuk "menghidupkan" persona Hitomi saat coding.
Avatar tampil sebagai jendela terapung di layar dan bereaksi ke aktivitas agent (Claude Code)
lewat *hooks*. Tujuan: ekspresif & menarik, bukan sekadar teks di terminal.

Konteks pemakaian: user ngoding di **Antigravity** dengan **Claude sebagai ekstensi** (= Claude Code
yang jalan, punya hooks). Overlay dibuat **IDE-agnostic** biar nggak tergantung API Antigravity.

## Status
🟢 **Fase 1a selesai.** Renderer pixi.js v8 (Vite+TS) di `app/` (http://127.0.0.1:5173). Loader manifest → scene ber-grup + animasi: blink · eye-track · head-tilt 2.5D · hair-sway · napas · sayap flap · aksesoris baju pendulum · plume kepala trailing. Aset: sayap `1a/1b`, baju `7b`, kepala `15a`(gerak)/`15b`(statis). **Api WebM ditunda** (nggak konsisten render, dicabut). **Sekarang → Fase 1b:** WebSocket bridge + verifikasi hooks Claude Code di Antigravity (risiko #1) → wrap Tauri. Repo masih 0 commit.

## Tech Stack (rencana)
- **Overlay shell:** Tauri (window transparan, always-on-top, click-through). *(Electron = plan B, lebih berat.)*
- **Render avatar:** Web + **pixi.js** — sprite berlayer, animasi prosedural.
- **Jembatan event:** server WebSocket kecil (Node/TS), ditembak oleh hook Claude Code.
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
33 layer PNG di `assets/avatar/hitomi/layers/`, kanvas seragam **1080×1440**, penamaan bernomor
(z besar = atas). Karakter: chibi gothic-lolita, twin-tail ungu-pink.
- Base: `1_back-accessories` → `8_headbase` · badan · 2 tangan (di belakang badan) · 3 grup rambut.
- **Mata:** base tracking (`10_eyes_background`+`pupil_left/right`+`frame`) + 7 variant utuh
  (`10a` closed, `10b` closed_happy, `10c` dizzy, `10d` shocked, `10e` angry, `10f` love/yandere, `10g` sad).
- **Mulut:** 9 varian (`9a`–`9i`). **Alis:** statis (`13`,`14`). Poni/rambut samping/aksesoris kepala.
- Manifest resmi + pivot akurat + state/event map: `assets/avatar/hitomi/manifest.json`.
- Template/guide/generator + preview komposit: `assets/avatar/hitomi/_template/`.

## Features
### Planned — Fase 1: Ekspresi State
- Map event → ekspresi: idle · mikir · ngoding · sukses (senyum) · error (cemberut/"cemburu").
- Idle liveliness: kedip mata, gerak napas/bob halus.
- Eye-tracking: pupil ikut kursor.
- Head-tracking: tilt + parallax 2.5D ke arah kursor (fake, bukan putar 3D).
- Hair sway: spring/sine physics ikut gerak kepala.

### Planned — Fase 2: Bubble Teks
- Tampilkan kalimat terakhir Hitomi dari transkrip `.jsonl`.

### Dibuang (sadar)
- **TTS / lip-sync** — kompleksitas + latency + butuh pipeline audio. (Catatan: TTS TIDAK makan token Claude.)
- **Live2D rig** — keunggulan utamanya (lip-sync halus) nggak kepakai tanpa TTS; ongkos aset/lisensi/berat nggak sepadan.

## Decision Log
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
- ⚠️ **Belum diverifikasi:** apakah hooks Claude Code benar-benar kepanggil saat dihost di dalam Antigravity. ~95% yakin iya (hooks = level engine), tapi WAJIB dites di menit pertama coding.
- Head-tracking = efek 2.5D condong/parallax, bukan putar kepala 3D asli (batas PNG flat).

## Next Steps
1. ✅ Aset seni + manifest + state/event map.
2. ✅ Scaffold renderer pixi.js ditulis (`app/`) — loader manifest + animasi + dev panel.
3. **`npm install` di `app/`** (butuh izin: pixi.js + vite) → `npm run dev` → verifikasi visual & tuning animasi.
4. Verifikasi hooks jalan di Antigravity (risiko #1) — masuk Fase 1b.
5. Fase 1b: bungkus Tauri (transparan/always-on-top/click-through) + bridge WebSocket → tembak event dari hook.

## References
- AIRI — https://github.com/moeru-ai/airi (inspirasi avatar; paket `stage-ui-live2d`, `stage-ui-three`)
- pixi.js — render 2D
- (opsi masa depan) Live2D Cubism Core — kalau upgrade ke rig; catat lisensi proprietary.
