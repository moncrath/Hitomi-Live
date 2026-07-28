# Changelog

Semua perubahan penting proyek ini dicatat di sini.

## [Unreleased]
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

### Deferred
- **Api WebM (ornamen kepala) ditunda.** Sempat diimplementasi (luma-key VP9 alpha + additive + autoplay hardening) tapi video nggak konsisten nongol di browser user → dicabut biar nggak menghambat. Aset `15c_head_accessories.webm` disimpan. Pelajaran teknis dicatat di memori (webm-additive-overlay-lesson).

### Notes
- 2026-07-28 — Proyek dibuat sebagai repo terpisah dari `Hitomi_Claude`. Pilihan avatar: PNGtuber 2.5D. Nunggu aset seni berlayer dari user.
