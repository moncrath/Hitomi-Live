export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Damping frame-rate independent menuju target.
 * `smoothing` = fraksi jarak yang MASIH tersisa setelah 1 detik (0<..<1).
 * dt dalam detik.
 */
export const damp = (current: number, target: number, smoothing: number, dt: number): number =>
  lerp(current, target, 1 - Math.pow(smoothing, dt));
