// Path aset. Dilayani lewat publicDir (../assets) => root URL.
export const AVATAR = 'hitomi';
export const MANIFEST_URL = `/avatar/${AVATAR}/manifest.json`;
export const LAYERS_BASE = `/avatar/${AVATAR}/layers/`;

/** URL PNG dari key layer (tanpa ekstensi), mis. "8_headbase" -> /avatar/hitomi/layers/8_headbase.png */
export const layerUrl = (key: string): string => `${LAYERS_BASE}${key}.png`;

// Kanvas seragam semua layer (registrasi presisi, tanpa offset manual).
export const CANVAS = { width: 1080, height: 1440 } as const;

// Tuning animasi terpusat (smoothing = fraksi jarak TERSISA setelah 1 detik;
// makin kecil makin gesit, makin besar makin ngelag).
export const TUNING = {
  head: { smoothing: 0.0009, maxRot: 0.12, parallaxX: 16, parallaxY: 9 },
  hair: { smoothing: 0.45, gain: 1.7 },
  bangs: { smoothing: 0.16, gain: 0.75 },
  eyes: { smoothing: 0.0035 },
  breath: { speed: 1.6, amount: 0.012 },
  // Sayap belakang bawah: flap idle (sine, mirror kiri-kanan) + condong ikut kepala.
  wings: { idleSpeed: 1.0, idleAmp: 0.05, reactGain: 0.5, smoothing: 0.25, dropY: 140 },
  // Aksesoris baju: pendulum halus (ga lebay).
  cloth: { idleSpeed: 0.8, idleAmp: 0.02, gain: 0.45, smoothing: 0.3 },
  // Plume kepala (15a): sway trailing di dalam head (rotasi relatif ke kepala).
  headAcc: { gain: 2.4, smoothing: 0.35 },
  dropY: 26, // geser kepala + rambut belakang turun (nutup potongan leher)
  fitScale: 0.95,
} as const;
