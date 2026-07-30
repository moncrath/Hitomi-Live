import { TUNING } from '../config';
import { damp } from '../math';
import type { AvatarRig } from '../rig/AvatarRig';

/**
 * Plume kepala (15a). Karena ini CHILD dari head (sudah ikut rotasi kepala),
 * sway = rotasi RELATIF: (lag - headRot). Saat kepala menyentak, plume tertinggal
 * sesaat lalu menyusul -> efek trailing. Idle (kepala diam) -> kembali ke 0.
 */
export class HeadAccessorySway {
  private lag = 0;

  update(rig: AvatarRig, headRot: number, dt: number): void {
    if (!rig.headAccessory) return; // skin tanpa plume kepala
    const h = TUNING.headAcc;
    this.lag = damp(this.lag, headRot, h.smoothing, dt);
    rig.headAccessory.rotation = (this.lag - headRot) * h.gain;
  }
}
