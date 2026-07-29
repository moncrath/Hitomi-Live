import { Application } from 'pixi.js';
import { BRIDGE_URL, CANVAS, TUNING } from './config';
import { BridgeClient } from './bridge/BridgeClient';
import { loadManifest } from './manifest';
import { PointerTracker } from './pointer';
import { AvatarRig } from './rig/AvatarRig';
import { StateController } from './state/StateController';
import { DevPanel } from './ui/DevPanel';
import { HeadTilt } from './anim/headTilt';
import { HairSway } from './anim/hairSway';
import { EyeTracking } from './anim/eyeTracking';
import { Blink } from './anim/blink';
import { Breathing } from './anim/breathing';
import { WingFlap } from './anim/wingFlap';
import { ClothSway } from './anim/clothSway';
import { HeadAccessorySway } from './anim/headAccessorySway';
import { isTauri, startTauriCursor } from './tauriCursor';
import { mountHitomiMenu } from './ui/HitomiMenu';
import { mountHitomiBubble } from './ui/HitomiBubble';
import { listenTauriSignal } from './bridge/tauriSignal';

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
    void mountHitomiBubble();
  }

  const manifest = await loadManifest();
  const rig = new AvatarRig();
  await rig.build(manifest);
  app.stage.addChild(rig.root);

  // Di Tauri: kursor dibaca global (poller), jadi matikan listener DOM biar tak bentrok.
  const ptr = new PointerTracker(window, !isTauri());
  if (isTauri()) void startTauriCursor(ptr);
  const state = new StateController(rig, manifest);
  state.apply('idle');

  const headTilt = new HeadTilt();
  const hairSway = new HairSway();
  const eyeTracking = new EyeTracking();
  const blink = new Blink(manifest);
  const breathing = new Breathing();
  const wingFlap = new WingFlap();
  const clothSway = new ClothSway();
  const headAccessorySway = new HeadAccessorySway();

  const layout = (): void => {
    const s =
      Math.min(window.innerWidth / CANVAS.width, window.innerHeight / CANVAS.height) *
      TUNING.fitScale;
    rig.root.scale.set(s);
    rig.root.position.set(window.innerWidth / 2, window.innerHeight / 2);
  };
  layout();
  window.addEventListener('resize', layout);

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    breathing.update(rig, dt);
    const headRot = headTilt.update(rig, ptr, dt);
    hairSway.update(rig, headRot, dt);
    wingFlap.update(rig, headRot, dt);
    clothSway.update(rig, headRot, dt);
    headAccessorySway.update(rig, headRot, dt);
    eyeTracking.update(rig, ptr, state.trackingActive, dt);
    blink.update(rig, state.baseMode, dt);
  });

  // DevPanel hanya untuk dev di browser; di overlay Tauri kontrol lewat tray.
  if (!isTauri()) new DevPanel(state, manifest);

  // Terima sinyal hook Claude Code -> map ke event/state.
  // Di Tauri: bridge in-process (Rust) via event Tauri. Di browser: WS bridge Node (dev).
  const onSignal = (s: { kind: string; name: string }): void => {
    if (s.kind === 'event') state.event(s.name);
    else state.apply(s.name);
  };
  if (isTauri()) {
    void listenTauriSignal(onSignal);
  } else {
    new BridgeClient(BRIDGE_URL, onSignal).connect();
  }

  // Bantu debug dari console.
  Object.assign(window as unknown as Record<string, unknown>, { hitomi: { app, rig, state } });
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre style="position:fixed;bottom:10px;left:10px;color:#ff8;background:#000a;padding:8px;border-radius:8px;max-width:90vw;white-space:pre-wrap">${String(err)}</pre>`,
  );
});
