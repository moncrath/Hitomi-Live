import { TUNING } from '../config';
import { damp } from '../math';
import type { PointerTracker } from '../pointer';
import type { AvatarRig } from '../rig/AvatarRig';

/**
 * Pupil ikut kursor. Hanya aktif saat mata = base (idle/mikir/ngoding).
 * Saat non-aktif, pupil kembali mulus ke tengah (0,0).
 */
export class EyeTracking {
  private ox = 0;
  private oy = 0;

  update(rig: AvatarRig, ptr: PointerTracker, active: boolean, dt: number): void {
    const [mx, my] = rig.manifest.eyes.pupils.max_offset;
    const tx = active ? ptr.nx * mx : 0;
    const ty = active ? ptr.ny * my : 0;

    this.ox = damp(this.ox, tx, TUNING.eyes.smoothing, dt);
    this.oy = damp(this.oy, ty, TUNING.eyes.smoothing, dt);

    rig.pupilL.position.set(this.ox, this.oy);
    rig.pupilR.position.set(this.ox, this.oy);
  }
}
