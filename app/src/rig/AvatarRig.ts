import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { CANVAS, TUNING, layerUrl } from '../config';
import type { Manifest, Vec2 } from '../types';

interface HairPiece {
  sprite: Sprite;
  pivot: Vec2;
}

/**
 * Menyusun 33 layer PNG jadi graf pixi ber-grup sesuai manifest:
 *  root
 *   ├ 1 back-accessories                (static)
 *   ├ backHair [2,3,4]                  (sway, di belakang badan)
 *   ├ 5 lefthand, 6 righthand           (static)
 *   ├ 7 body                            (napas)
 *   └ head (pivot leher 534,790)        (tilt 2.5D)
 *        ├ 8 headbase
 *        ├ mouth (swap tekstur)
 *        ├ eyes [bg, pupilL, pupilR, frame, variant, blink]
 *        ├ 11 side-hair, 12 bangs (sway), 13/14 brows, 15 head-acc
 *
 * Semua layer 1080×1440 -> ditaruh anchor 0 di (0,0) = registrasi otomatis.
 * Sprite yang berotasi (rambut) pakai pivot==position agar diam saat rotasi 0.
 */
export class AvatarRig {
  readonly root = new Container();
  readonly head = new Container();
  readonly eyes = new Container();
  readonly backHair = new Container();
  readonly backWings = new Container();

  readonly textures = new Map<string, Texture>();

  manifest!: Manifest;

  // Referensi cepat untuk animasi.
  body!: Sprite;
  mouth!: Sprite;
  eyeBg!: Sprite;
  pupilL!: Sprite;
  pupilR!: Sprite;
  eyeFrame!: Sprite;
  eyeVariant!: Sprite;
  eyeBlink!: Sprite;
  bangs!: Sprite;
  hairPieces: HairPiece[] = [];

  // Aksesoris bergerak.
  wingLeft!: Sprite;
  wingRight!: Sprite;
  cloth!: Sprite;
  headAccessory!: Sprite; // 15a plume (sway trailing)

  private tex(key: string): Texture {
    const t = this.textures.get(key);
    if (!t) throw new Error(`Tekstur belum dimuat: ${key}`);
    return t;
  }

  private make(key: string): Sprite {
    const s = new Sprite(this.tex(key));
    s.label = key;
    return s;
  }

  async build(manifest: Manifest): Promise<void> {
    this.manifest = manifest;

    // Kumpulkan semua key unik yang mungkin dipakai (idle + variant mata + variant mulut).
    const keys = new Set<string>(manifest.z_order_idle);
    manifest.eyes.base.forEach((k) => keys.add(k));
    Object.values(manifest.eyes.variants).forEach((k) => keys.add(k));
    Object.values(manifest.mouths).forEach((k) => keys.add(k));

    const bundle: Record<string, string> = {};
    for (const k of keys) bundle[k] = layerUrl(k);
    Assets.addBundle('avatar', bundle);
    const loaded = (await Assets.loadBundle('avatar')) as Record<string, Texture>;
    for (const k of keys) this.textures.set(k, loaded[k]);

    // --- lapisan belakang: sayap kiri/kanan (flap) ---
    const back = manifest.groups.back_dynamic.members;
    this.wingLeft = this.make('1a_back-accessories_left');
    this.wingRight = this.make('1b_back-accessories_right');
    for (const [sprite, key] of [
      [this.wingLeft, '1a_back-accessories_left'],
      [this.wingRight, '1b_back-accessories_right'],
    ] as const) {
      const p = back[key].pivot;
      sprite.pivot.set(p[0], p[1]);
      sprite.position.set(p[0], p[1]);
    }
    this.backWings.addChild(this.wingLeft, this.wingRight);
    this.backWings.y = TUNING.wings.dropY; // turunkan sayap sedikit

    const hair = manifest.groups.hair_dynamic.members;
    for (const key of ['2_back-hair', '3_lefthair_back', '4_righthair_back']) {
      const s = this.make(key);
      const p = hair[key].pivot;
      s.pivot.set(p[0], p[1]);
      s.position.set(p[0], p[1]);
      this.backHair.addChild(s);
      this.hairPieces.push({ sprite: s, pivot: p });
    }

    const leftHand = this.make('5_lefthand');
    const rightHand = this.make('6_righthand');

    this.body = this.make('7_body');
    // Napas: skala vertikal halus dari dasar badan -> pivot bawah-tengah.
    this.body.pivot.set(CANVAS.width / 2, CANVAS.height);
    this.body.position.set(CANVAS.width / 2, CANVAS.height);

    // Aksesoris baju (pendulum), pivot di titik gantung.
    this.cloth = this.make('7b_body_acessories');
    const clothPivot = manifest.groups.cloth_dynamic.members['7b_body_acessories'].pivot;
    this.cloth.pivot.set(clothPivot[0], clothPivot[1]);
    this.cloth.position.set(clothPivot[0], clothPivot[1]);

    // --- grup kepala ---
    const headbase = this.make('8_headbase');
    this.mouth = this.make('9b_mouth_closed');

    this.eyeBg = this.make('10_eyes_background');
    this.pupilL = this.make('10_eyes_pupil_left');
    this.pupilR = this.make('10_eyes_pupil_right');
    this.eyeFrame = this.make('10_eyes_frame');
    this.eyeVariant = new Sprite(); // tekstur di-set saat ganti state
    this.eyeVariant.visible = false;
    this.eyeBlink = new Sprite(this.tex(manifest.blink.overlay));
    this.eyeBlink.visible = false;
    this.eyes.addChild(this.eyeBg, this.pupilL, this.pupilR, this.eyeFrame, this.eyeVariant, this.eyeBlink);

    const sideHair = this.make('11_side_small_hair');

    this.bangs = this.make('12_bangs');
    const bp = hair['12_bangs'].pivot;
    this.bangs.pivot.set(bp[0], bp[1]);
    this.bangs.position.set(bp[0], bp[1]);

    const browL = this.make('13_left_eyebrow');
    const browR = this.make('14_right_eyebrow');

    // Aksesoris kepala (z: 15a plume paling bawah, lalu 15b statis, api paling atas).
    this.headAccessory = this.make('15a_head_accessories');
    const accPivot = manifest.groups.head_accessory_dynamic.members['15a_head_accessories'].pivot;
    this.headAccessory.pivot.set(accPivot[0], accPivot[1]);
    this.headAccessory.position.set(accPivot[0], accPivot[1]);
    const headAccStatic = this.make('15b_head_accessories');

    this.head.addChild(
      headbase,
      this.mouth,
      this.eyes,
      sideHair,
      this.bangs,
      browL,
      browR,
      this.headAccessory,
      headAccStatic,
    );
    const hpv = manifest.groups.head_group.pivot;
    this.head.pivot.set(hpv[0], hpv[1]);
    this.head.position.set(hpv[0], hpv[1]);

    // Rambut belakang ikut turun bareng kepala (head di-drop via headTilt).
    this.backHair.y = TUNING.dropY;

    // --- rakit root sesuai z-order (bawah -> atas) ---
    this.root.addChild(
      this.backWings,
      this.backHair,
      leftHand,
      rightHand,
      this.body,
      this.cloth,
      this.head,
    );
    this.root.pivot.set(CANVAS.width / 2, CANVAS.height / 2);
  }
}
