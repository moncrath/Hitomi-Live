# Hitomi-Live

Overlay avatar **PNGtuber 2.5D** yang menghidupkan persona coding-assistant **Hitomi**.
Avatar terapung di layar dan bereaksi ke aktivitas Claude Code (lewat hooks) — ekspresi state + bubble teks.

> Status: 🟡 Planning. Lihat [Master State](docs/Hitomi-Live%20-%20Master%20State.md) untuk detail lengkap & keputusan.

## Konsep singkat
```
Claude Code (hooks) ──► Bridge WebSocket lokal ──► Overlay PNGtuber (pixi.js)
```
- **Fase 1:** ekspresi state (idle/mikir/ngoding/sukses/error) + kedip, eye/head-tracking, rambut goyang.
- **Fase 2:** bubble teks (kalimat terakhir Hitomi, dibaca dari transkrip — 0 token tambahan).
- **Tanpa TTS.** Tanpa Live2D rig (PNGtuber murah & ringan; upgrade nanti = ganti renderer saja).

## Tech Stack (rencana)
Tauri · web + pixi.js · WebSocket bridge (Node/TS) · aset seni PNG berlayer.

## Aset
Karakter disediakan sebagai **layer terpisah** (rambut belakang, badan, kepala, mata buka/tutup, pupil, alis+mulut, rambut depan).
