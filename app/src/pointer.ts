/** Posisi kursor dinormalisasi ke offset dari pusat layar: -1..1 (x,y). */
export class PointerTracker {
  nx = 0;
  ny = 0;

  constructor(target: Window = window) {
    target.addEventListener('pointermove', (e) => {
      this.nx = (e.clientX / target.innerWidth) * 2 - 1;
      this.ny = (e.clientY / target.innerHeight) * 2 - 1;
    });
  }
}
