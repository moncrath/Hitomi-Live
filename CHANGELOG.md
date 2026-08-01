# Changelog

Semua perubahan penting proyek ini dicatat di sini.

## [Unreleased]
### Added
- **Interface renderer** (`app/src/renderer/`): `AvatarRenderer` (kontrak semantik — state, event,
  flash, talking, layout, update) + `PngRenderer` (implementasi rig PNG sekarang). Persiapan
  Live2D sebagai implementasi kedua di branch `live2d`.

### Changed
- **Fisika rambut jadi nyata (pegas + deformasi mesh).** Rambut belakang tak lagi sprite kaku:
  - `springStep` (pegas orde-2 dgn kecepatan) menggantikan peredam orde-1 → rambut **melewati
    target lalu bergoyang** sebelum diam, bukan sekadar meluncur.
  - Rambut dirender sebagai `MeshPlane` (kisi 2×14). Tiap baris vertex digeser sebanding
    **kuadrat** jarak dari pivot → pangkal diam, ujung melengkung.
  - Dua pegas per potong (pangkal + ujung yg lebih lembek); selisihnya = besar lengkungan,
    jadi rambut melengkung saat bergerak & lurus sendiri saat diam.
  - Terukur: puncak lengkung ~154px, 57 fps, tanpa artefak. Tuning di `TUNING.hair`.
- **Polish bubble teks:** ekor bubble (segitiga ber-outline pink) menunjuk ke arah kepala avatar,
  ikut sisi kiri/kanan; animasi muncul pakai pop overshoot dengan titik tumpu di pangkal ekor.
- Bubble kini juga di-mount saat dev di browser; DevPanel dapat tombol **"bubble teks"** untuk
  memicunya (sebelumnya cuma bisa diuji lewat overlay Tauri).

## [1.0.0] - 2026-07-30
### Added
- Inisialisasi proyek: folder, `CLAUDE.md` (persona Hitomi), docs planning.
- Master State dengan arsitektur, scope (Fase 1+2, no TTS), dan Decision Log awal.
- **Fase 1a — scaffold renderer** (`app/`): Vite + TypeScript strict + pixi.js v8.
  - Loader `manifest.json` → `AvatarRig` menyusun 33 layer jadi scene ber-grup (head / hair / static).
  - Animasi prosedural: blink, eye-tracking (pupil base), head-tilt 2.5D + parallax, hair-sway (spring-lag), napas badan.
  - `StateController` (swap mata/mulut per state + peta event hook) + `DevPanel` tombol debug.
  - `vite.config.ts` `publicDir` → `../assets` (aset dilayani tanpa duplikasi).
- **Aksesoris bergerak** (aset user baru):
  - Sayap `1a`/`1b` (pecah kiri-kanan) — `WingFlap`: flap idle mirror + condong ikut kepala.
  - Aksesoris baju `7b` — `ClothSway`: pendulum halus gain kecil.
  - Aksesoris kepala dipisah: `15b` statis + `15a` plume — `HeadAccessorySway` (trailing relatif).
  - Manifest: grup `back_dynamic` / `cloth_dynamic` / `head_accessory_dynamic`.
- **Fase 1b — jembatan event (bridge + hooks):**
  - WS bridge lokal (`bridge/`, port 17872): `POST /event` → broadcast `WS /ws`; relay-nama murni + validasi ketat (regex, cap panjang), tak pernah eksekusi apa pun.
  - Hook poster `hooks/notify.mjs` fire-and-forget (timeout 400ms, selalu exit 0 → tak pernah blok Claude Code).
  - Client overlay `BridgeClient` auto-reconnect, di-wire di `main.ts`. **Terverifikasi end-to-end di Antigravity** (notif hook kepanggil beneran).
- **Fase 1c — shell overlay Tauri** (`app/src-tauri/`, Tauri v2 + Rust):
  - Window **frameless, transparan, always-on-top** yang mengambang di desktop; bootstrap **bertahap dari window normal** demi keamanan (lihat catatan).
  - **Tracking kursor global** via command `cursor_norm` (`windows` crate `GetCursorPos`) + poller frontend → eye/head-tracking tetap jalan walau overlay **tembus-klik**.
  - **Tray** (Keluar + toggle tembus-klik) sebagai kontrol utama + tombol darurat. **Drag** window via `startDragging` (+ permission `core:window:allow-start-dragging`).
  - **Menu Hitomi in-app**: ikon panah flip (arrow.png) + panel (fill `#3e2271`, border `#fab3df`, teks putih, font **Vividly**); **grid tombol ukuran 1–10**; toggle **sisi bubble** (kanan/kiri).
  - Command `resize_overlay` (rasio 3:4, anchor tengah menghormati posisi drag).

- **Fase 2 — bubble teks** (0 token, no TTS):
  - `notify.mjs` pada hook `Stop`: baca `transcript_path` `.jsonl` → ambil **kalimat terakhir Hitomi** (assistant terakhir yg ada teks; strip markdown ringan; cap 180 char) → POST `/bubble`.
  - Rust bridge: endpoint `POST /bubble` (body ≤4KB, teks ≤600 char) → emit event Tauri `hitomi://bubble`.
  - `HitomiBubble` overlay: panel teks (ungu/pink, font Vividly) muncul di sisi sesuai `hitomi.bubbleSide`, auto-hilang (durasi ikut panjang teks).
- **Polish ekspresi:** animasi "ngomong" saat bubble tampil (`TalkAnim`: mata dipaksa `closed_happy` sepanjang durasi + mulut gantian `9aa`/`9ab`); **idle emote** sesekali (love/senang/minder) via `IdleEmote`; **mood error** (`coding_error`→dizzy, `error_streak`≥3→marah, dideteksi di `notify.mjs`); **bubble "thinking"** (`ThinkingBubble`, pixi) muncul saat mikir/ngoding dgn ikon berputar, mirror ikut sisi.
- **Ganti skin karakter** (menu → *Skin*): tekstur dipisah per-skin di `skin/<id>/`, dipilih data-driven dari `skins.json`; ganti skin → simpan `hitomi.skin` + reload. **Fleksibel:** tiap skin boleh punya `skin/<id>/manifest.json` sendiri (geometri/pivot beda per karakter) — fallback ke manifest bersama bila tak ada. **Rig toleran:** cuma layer inti wajib; layer opsional yang hilang di-skip (bukan crash), jadi skin boleh beda jumlah file. Skrip `scripts/check-skins.mjs` cek kelengkapan (inti ✖ / opsional ⚠).

### Changed
- **Portable build + auto-hook global:** `tauri build --no-bundle` → **satu exe self-contained** (`app/src-tauri/target/release/app.exe`, frontend+aset ke-embed). Icon dari `app-icon.png` (di-pad 1024²). Hook dijadikan **global** di `~/.claude/settings.json` (script stabil `~/.claude/hooks/hitomi-notify.mjs`) → semua project auto-bereaksi tanpa setup, cukup jalankan 1 exe. Hook per-project repo ini dikosongkan (cegah dobel-fire). Cakupan: **universal** (bereaksi di semua sesi Claude Code; kontrol via nyala/mati exe).
- **Aset direstruktur untuk multi-skin:** `assets/avatar/hitomi/layers/` → `assets/avatar/hitomi/skin/Roccia/` (skin sekarang = **Roccia**, Wuthering Waves; sementara sampai skin orisinal Hitomi siap). `config.layerUrl` kini pakai skin aktif; tambah `skins.json`.
- **Ekspresi lebih hidup:** `mikir` & `ngoding` kini beda dari `idle` (mata tetap base → tracking jalan). Mulut **random gantian**: mikir = `pout`/`bleeh`, ngoding = `happy1`/`frawl` (aset `9j`,`9k` didaftarkan). Durasi flash `sukses`/`love` 0.9s → **1.6s**. `StateDef.mouths[]` = pool mulut acak.
- **Bridge diserap ke dalam overlay (Rust `tiny_http`)** — hook POST `127.0.0.1:17872/event` → emit event Tauri `hitomi://signal` → avatar. Tujuan: launch overlay = semua jalan, 1 exe mandiri tanpa Node. Frontend Tauri pakai `listen()`; browser-dev tetap WS (`bridge/` Node opsional). Bind retry 10× (tahan race port saat hot-reload dev).
- **Eye-tracking jadi look-at akurat** — pupil menatap TITIK kursor (per mata, via `eyes.toGlobal` + kursor relatif window `cursor_norm` uv), bukan sekadar condong relatif layar.
- `TUNING.fitScale` 0.95 → **0.82** (beri margin di window supaya rambut/parallax tak kepotong di tepi).
- Font UI: Komika (`KOMIKAX_.ttf`) → **Vividly** (`Vividly-Regular.ttf`, 100% free). Aset UI dipindah ke `assets/ui/`.

### Deferred
- **Api WebM (ornamen kepala) ditunda.** Sempat diimplementasi (luma-key VP9 alpha + additive + autoplay hardening) tapi video nggak konsisten nongol di browser user → dicabut biar nggak menghambat. Aset `15c_head_accessories.webm` disimpan. Pelajaran teknis dicatat di memori (webm-additive-overlay-lesson).

### Notes
- 2026-07-28 — Proyek dibuat sebagai repo terpisah dari `Hitomi_Claude`. Pilihan avatar: PNGtuber 2.5D. Nunggu aset seni berlayer dari user.
