import { TUNING } from '../config';
import { damp } from '../math';
import type { AvatarRig } from '../rig/AvatarRig';

/** Rambut mengejar rotasi kepala dengan lag (spring damping) => efek goyang. */
export class HairSway {
  private vals: number[] = [];
  private bangsVal = 0;

  update(rig: AvatarRig, headRot: number, dt: number): void {
    const h = TUNING.hair;
    rig.hairPieces.forEach((piece, i) => {
      const prev = this.vals[i] ?? 0;
      const next = damp(prev, headRot, h.smoothing, dt);
      this.vals[i] = next;
      piece.sprite.rotation = next * h.gain;
    });

    if (rig.bangs) {
      const b = TUNING.bangs;
      this.bangsVal = damp(this.bangsVal, headRot, b.smoothing, dt);
      rig.bangs.rotation = this.bangsVal * b.gain;
    }
  }
}
