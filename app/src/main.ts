import { Application } from 'pixi.js';
import { BRIDGE_URL } from './config';
import { BridgeClient } from './bridge/BridgeClient';
import { loadManifest } from './manifest';
import { PointerTracker } from './pointer';
import type { AvatarRenderer } from './renderer/AvatarRenderer';
import { PngRenderer } from './renderer/PngRenderer';
import { IdleEmote } from './state/idleEmote';
import { DevPanel } from './ui/DevPanel';
import { isTauri, startTauriCursor } from './tauriCursor';
import { mountHitomiMenu } from './ui/HitomiMenu';
import { mountHitomiBubble, type BubbleController } from './ui/HitomiBubble';
import { ThinkingBubble } from './ui/ThinkingBubble';
import { listenTauriSignal, listenTauriSetup } from './bridge/tauriSignal';

async function boot(): Promise<void> {
  // Di Tauri, body harus benar-benar transparan (CSS dev pakai checker gelap untuk browser).
  if (isTauri()) {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
  }

  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0, // transparan (siap jadi overlay Tauri)
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  document.getElementById('app')!.appendChild(app.canvas);

  // Overlay frameless: kanvas pointer-events:none supaya mousedown jatuh ke #app,
  // lalu HitomiMenu memakai window.startDragging() untuk menyeret. Menu = kontainer
  // sibling (tombolnya tetap bisa diklik, tidak ikut terseret).
  if (isTauri()) {
    app.canvas.style.pointerEvents = 'none';
    mountHitomiMenu();
  }

  const manifest = await loadManifest();

  // Di Tauri: kursor dibaca global (poller), jadi matikan listener DOM biar tak bentrok.
  const ptr = new PointerTracker(window, !isTauri());
  if (isTauri()) void startTauriCursor(ptr);

  // Pemilihan renderer = satu-satunya tempat yang tahu jenisnya; sisanya lewat kontrak.
  const png = new PngRenderer(ptr);
  await png.load(manifest);
  const renderer: AvatarRenderer = png;
  app.stage.addChild(renderer.view);

  // Bubble "thinking" (muncul saat mikir/ngoding), align ke kanvas avatar.
  const thinking = new ThinkingBubble();
  await thinking.load();
  renderer.attachCanvasOverlay(thinking.container);

  const layout = (): void => renderer.layout(window.innerWidth, window.innerHeight);
  layout();
  window.addEventListener('resize', layout);

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    renderer.update(dt);
    const st = renderer.currentState;
    thinking.setVisible(st === 'mikir' || st === 'ngoding');
    thinking.update(dt);
  });

  // Bubble + animasi "ngomong": mata closed_happy + mulut bergerak selama bubble
  // tampil; saat selesai, wajah di-restore ke state logis saat ini.
  const bubble: BubbleController = await mountHitomiBubble({
    onShow: () => renderer.setTalking(true),
    onHide: () => renderer.setTalking(false),
  });

  // Idle emote: sesekali ganti ekspresi lucu saat idle (bukan pas kerja/ngomong).
  const idleEmote = new IdleEmote(
    renderer,
    () => renderer.currentState === 'idle' && !renderer.isTalking,
  );
  idleEmote.start();

  // DevPanel hanya untuk dev di browser; di overlay Tauri kontrol lewat tray.
  if (!isTauri()) {
    new DevPanel(renderer, manifest, () =>
      bubble.show('Sudah kubereskan, Sayang. Kodenya rapi dan aman sekarang 💗'),
    );
  }

  // Terima sinyal hook Claude Code -> map ke event/state.
  // Di Tauri: bridge in-process (Rust) via event Tauri. Di browser: WS bridge Node (dev).
  // Aktivitas baru (prompt/tool) → berhenti "ngomong" (sembunyikan bubble).
  const ACTIVITY = new Set(['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Notification']);
  const onSignal = (s: { kind: string; name: string }): void => {
    if (s.kind === 'event') {
      if (ACTIVITY.has(s.name)) bubble.hide();
      renderer.event(s.name);
    } else {
      renderer.setState(s.name);
    }
  };
  if (isTauri()) {
    void listenTauriSignal(onSignal);
    // Hasil pemasangan hook otomatis. Hitomi cuma bersuara kalau ada yang perlu
    // kamu tahu — kalau semua beres dari awal, dia diam saja (tak perlu berisik).
    void listenTauriSetup((r) => {
      if (!r.node) {
        renderer.flash('minder', 4000);
        bubble.show('Sayang, Node.js belum ada — hook-nya nggak bisa jalan tanpa itu. 🥺');
      } else if (r.changed) {
        renderer.flash('love', 2500);
        bubble.show('Hook Claude Code sudah kupasang sendiri, Sayang. Siap menemanimu 💗');
      }
    });
  } else {
    new BridgeClient(BRIDGE_URL, onSignal).connect();
  }

  // Bantu debug dari console.
  Object.assign(window as unknown as Record<string, unknown>, { hitomi: { app, renderer } });
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre style="position:fixed;bottom:10px;left:10px;color:#ff8;background:#000a;padding:8px;border-radius:8px;max-width:90vw;white-space:pre-wrap">${String(err)}</pre>`,
  );
});
