import { TUNING } from '../config';
import { damp } from '../math';
import type { AvatarRig } from '../rig/AvatarRig';

/** Sayap belakang: flap idle (sine, mirror kiri-kanan) + condong ikut kepala dengan lag. */
export class WingFlap {
  private t = 0;
  private react = 0;

  update(rig: AvatarRig, headRot: number, dt: number): void {
    const w = TUNING.wings;
    this.t += dt;
    const flap = Math.sin(this.t * w.idleSpeed) * w.idleAmp;
    this.react = damp(this.react, headRot * w.reactGain, w.smoothing, dt);

    // Mirror: saat idle keduanya mengepak berlawanan (buka-tutup), plus condong sama ke arah kepala.
    rig.wingLeft.rotation = flap + this.react;
    rig.wingRight.rotation = -flap + this.react;
  }
}
