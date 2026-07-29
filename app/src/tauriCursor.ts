import type { PointerTracker } from './pointer';

/** True jika renderer jalan di dalam shell Tauri (bukan browser dev biasa). */
export function isTauri(): boolean {
  return typeof (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== 'undefined';
}

/**
 * Saat overlay click-through, webview tak menerima `mousemove`, jadi eye/head-tracking
 * kehilangan sumber kursor. Di sini kita polling posisi kursor GLOBAL dari Rust
 * (command `cursor_norm`, sudah dinormalisasi -1..1) dan menyuntikkannya ke tracker.
 */
export async function startTauriCursor(ptr: PointerTracker): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');
  const tick = async (): Promise<void> => {
    try {
      const [sx, sy, wu, wv] = await invoke<[number, number, number, number]>('cursor_norm');
      ptr.nx = sx;
      ptr.ny = sy;
      ptr.wu = wu;
      ptr.wv = wv;
    } catch {
      /* command belum siap saat boot awal — abaikan, coba lagi frame berikut */
    }
    setTimeout(tick, 16); // ~60fps
  };
  void tick();
}
