// Path aset. Dilayani lewat publicDir (../assets) => root URL.
export const AVATAR = 'hitomi';
export const DEFAULT_SKIN = 'Roccia';
export const MANIFEST_URL = `/avatar/${AVATAR}/manifest.json`; // template/fallback bersama
export const SKINS_URL = `/avatar/${AVATAR}/skins.json`;

/** Skin aktif = set tekstur karakter (folder di `skin/`). Disimpan di localStorage. */
export const getSkin = (): string => localStorage.getItem('hitomi.skin') || DEFAULT_SKIN;

/** Manifest KHUSUS skin (opsional). Bila ada → geometri/pivot/z-order milik skin itu
 *  sendiri (karakter beda bentuk). Bila tak ada → pakai `MANIFEST_URL` bersama. */
export const skinManifestUrl = (): string => `/avatar/${AVATAR}/skin/${getSkin()}/manifest.json`;

/** URL PNG dari key layer utk skin aktif, mis. "8_headbase" -> /avatar/hitomi/skin/Roccia/8_headbase.png */
export const layerUrl = (key: string): string => `/avatar/${AVATAR}/skin/${getSkin()}/${key}.png`;

// Kanvas seragam semua layer (registrasi presisi, tanpa offset manual).
export const CANVAS = { width: 1080, height: 1440 } as const;

// Bridge lokal (hook Claude Code -> event). Overlay konek ke sini via WebSocket.
export const BRIDGE_URL = 'ws://127.0.0.1:17872/ws';

// Tuning animasi terpusat (smoothing = fraksi jarak TERSISA setelah 1 detik;
// makin kecil makin gesit, makin besar makin ngelag).
export const TUNING = {
  head: { smoothing: 0.0009, maxRot: 0.12, parallaxX: 16, parallaxY: 9 },
  hair: { smoothing: 0.45, gain: 1.7 },
  bangs: { smoothing: 0.16, gain: 0.75 },
  // Look-at mata: reach = fraksi ukuran avatar; kursor sejauh ~reach dari mata = deflect penuh.
  eyes: { smoothing: 0.0035, reach: 0.5 },
  breath: { speed: 1.6, amount: 0.012 },
  // Sayap belakang bawah: flap idle (sine, mirror kiri-kanan) + condong ikut kepala.
  wings: { idleSpeed: 1.0, idleAmp: 0.05, reactGain: 0.5, smoothing: 0.25, dropY: 140 },
  // Aksesoris baju: pendulum halus (ga lebay).
  cloth: { idleSpeed: 0.8, idleAmp: 0.02, gain: 0.45, smoothing: 0.3 },
  // Plume kepala (15a): sway trailing di dalam head (rotasi relatif ke kepala).
  headAcc: { gain: 2.4, smoothing: 0.35 },
  dropY: 26, // geser kepala + rambut belakang turun (nutup potongan leher)
  // <1 memberi margin di dalam window supaya rambut/parallax tak kepotong di tepi.
  fitScale: 0.82,
} as const;
