/**
 * Terima sinyal dari bridge in-process (Rust) via event Tauri `hitomi://signal`.
 * Menggantikan koneksi WebSocket saat berjalan di dalam overlay Tauri — tak perlu
 * proses bridge Node terpisah lagi.
 */
export async function listenTauriSignal(
  cb: (s: { kind: string; name: string }) => void,
): Promise<void> {
  const { listen } = await import('@tauri-apps/api/event');
  await listen<{ kind: string; name: string }>('hitomi://signal', (e) => cb(e.payload));
}
