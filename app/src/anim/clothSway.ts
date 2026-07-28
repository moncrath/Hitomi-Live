import { TUNING } from '../config';
import { damp } from '../math';
import type { AvatarRig } from '../rig/AvatarRig';

/** Aksesoris baju: pendulum halus — idle sine pelan + ikut condong kepala (gain kecil, ga lebay). */
export class ClothSway {
  private t = 0;
  private v = 0;

  update(rig: AvatarRig, headRot: number, dt: number): void {
    const c = TUNING.cloth;
    this.t += dt;
    const idle = Math.sin(this.t * c.idleSpeed) * c.idleAmp;
    this.v = damp(this.v, headRot * c.gain, c.smoothing, dt);
    rig.cloth.rotation = idle + this.v;
  }
}
