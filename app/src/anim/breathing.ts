import { TUNING } from '../config';
import type { AvatarRig } from '../rig/AvatarRig';

/** Napas: badan mengembang-kempis vertikal halus dari dasar (pivot bawah). */
export class Breathing {
  private t = 0;

  update(rig: AvatarRig, dt: number): void {
    this.t += dt;
    const s = 1 + Math.sin(this.t * TUNING.breath.speed) * TUNING.breath.amount;
    rig.body.scale.set(1, s);
  }
}
