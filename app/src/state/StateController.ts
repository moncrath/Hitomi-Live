import type { Manifest } from '../types';
import type { AvatarRig } from '../rig/AvatarRig';

/** Durasi state "flash" (sukses/love) sebelum balik ke state dasar. */
const FLASH_MS = 1600;

/**
 * Menerapkan state (swap mata utuh/variant + mulut + flag tracking) dan event
 * (flash sekejap lalu balik). Menyimpan mode aktif untuk dibaca animasi.
 */
export class StateController {
  current = 'idle';
  baseMode = true; // mata = base (pupil bergerak) vs variant (beku)
  trackingWanted = true;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly rig: AvatarRig,
    private readonly m: Manifest,
  ) {}

  /** Tracking benar-benar jalan hanya bila state minta DAN mata = base. */
  get trackingActive(): boolean {
    return this.trackingWanted && this.baseMode;
  }

  apply(name: string): void {
    const st = this.m.states[name];
    if (!st) {
      console.warn(`State tak dikenal: ${name}`);
      return;
    }
    this.current = name;
    const { rig } = this;

    // Mulut: acak dari `mouths` bila ada (variasi), selain itu `mouth` tunggal.
    const mouthName =
      st.mouths && st.mouths.length
        ? st.mouths[Math.floor(Math.random() * st.mouths.length)]
        : st.mouth;
    const mouthKey = mouthName ? this.m.mouths[mouthName] : undefined;
    if (mouthKey) rig.mouth.texture = rig.textures.get(mouthKey)!;

    if (st.eyes === 'base') {
      this.baseMode = true;
      rig.eyeVariant.visible = false;
      rig.eyeBg.visible = rig.pupilL.visible = rig.pupilR.visible = rig.eyeFrame.visible = true;
    } else {
      this.baseMode = false;
      const vk = this.m.eyes.variants[st.eyes];
      if (vk) {
        rig.eyeVariant.texture = rig.textures.get(vk)!;
        rig.eyeVariant.visible = true;
      }
      rig.eyeBg.visible = rig.pupilL.visible = rig.pupilR.visible = rig.eyeFrame.visible = false;
      rig.eyeBlink.visible = false;
    }

    this.trackingWanted = st.tracking;
  }

  /** Peta hook Claude Code -> reaksi. */
  event(name: string): void {
    const ev = this.m.events[name];
    if (!ev) {
      console.warn(`Event tak dikenal: ${name}`);
      return;
    }
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
    if (ev.flash) {
      this.apply(ev.flash);
      const back = ev.then ?? 'idle';
      this.flashTimer = setTimeout(() => this.apply(back), FLASH_MS);
    } else if (ev.state) {
      this.apply(ev.state);
    }
  }
}
