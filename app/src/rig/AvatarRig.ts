import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { CANVAS, TUNING, layerUrl, getSkin } from '../config';
import type { Manifest, Vec2 } from '../types';
import { makeHairMesh, type HairMesh } from './hairMesh';

/** Layer inti yang WAJIB ada di tiap skin (rig tak berarti tanpa ini). Sisanya
 *  (sayap, tangan, cloth, side-hair, bangs, alis, aksesoris kepala, variant mata,
 *  mulut ekstra) opsional → hilang = di-skip, bukan crash. */
const REQUIRED_LAYERS = [
  '7_body',
  '8_headbase',
  '9b_mouth_closed',
  '10_eyes_background',
  '10_eyes_pupil_left',
  '10_eyes_pupil_right',
  '10_eyes_frame',
];

interface HairPiece {
  /** Mesh (bukan sprite): selain diputar, bisa dilengkungkan. */
  hair: HairMesh;
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
  bangs: Sprite | null = null;
  hairPieces: HairPiece[] = [];

  // Aksesoris bergerak (opsional — bisa null bila skin tak punya).
  wingLeft: Sprite | null = null;
  wingRight: Sprite | null = null;
  cloth: Sprite | null = null;
  headAccessory: Sprite | null = null; // 15a plume (sway trailing)

  private tex(key: string): Texture {
    const t = this.textures.get(key);
    if (!t) throw new Error(`Tekstur belum dimuat: ${key}`);
    return t;
  }

  /** Sprite dari layer WAJIB (throw bila hilang — sudah divalidasi di build). */
  private make(key: string): Sprite {
    const s = new Sprite(this.tex(key));
    s.label = key;
    return s;
  }

  /** Sprite dari layer OPSIONAL: null bila tekstur tak dimuat (skin tak punya). */
  private tryMake(key: string): Sprite | null {
    const t = this.textures.get(key);
    if (!t) return null;
    const s = new Sprite(t);
    s.label = key;
    return s;
  }

  /** Set pivot = posisi (poros rotasi di tempat) bila pivot tersedia di manifest. */
  private setPivot(sprite: Sprite, pivot?: Vec2): void {
    if (!pivot) return;
    sprite.pivot.set(pivot[0], pivot[1]);
    sprite.position.set(pivot[0], pivot[1]);
  }

  async build(manifest: Manifest): Promise<void> {
    this.manifest = manifest;

    // Kumpulkan semua key unik yang mungkin dipakai (idle + variant mata + mulut + blink).
    const keys = new Set<string>(manifest.z_order_idle);
    manifest.eyes.base.forEach((k) => keys.add(k));
    Object.values(manifest.eyes.variants).forEach((k) => keys.add(k));
    Object.values(manifest.mouths).forEach((k) => keys.add(k));
    if (manifest.blink?.overlay) keys.add(manifest.blink.overlay);

    // Muat TOLERAN: layer yang 404 di-skip (bukan gagal-total seperti loadBundle).
    const missing: string[] = [];
    await Promise.all(
      [...keys].map(async (k) => {
        try {
          this.textures.set(k, (await Assets.load(layerUrl(k))) as Texture);
        } catch {
          missing.push(k);
        }
      }),
    );
    if (missing.length) {
      console.warn(`[skin ${getSkin()}] ${missing.length} layer opsional tak ada, di-skip:`, missing);
    }
    // Layer inti wajib ada — kalau tidak, laporkan jelas (bukan blank misterius).
    const coreMissing = REQUIRED_LAYERS.filter((k) => !this.textures.has(k));
    if (coreMissing.length) {
      throw new Error(`Skin "${getSkin()}" tak lengkap — layer inti hilang: ${coreMissing.join(', ')}`);
    }

    const back = manifest.groups.back_dynamic?.members;
    const hair = manifest.groups.hair_dynamic?.members;

    // --- lapisan belakang: sayap kiri/kanan (flap), opsional ---
    this.wingLeft = this.tryMake('1a_back-accessories_left');
    this.wingRight = this.tryMake('1b_back-accessories_right');
    if (this.wingLeft) this.setPivot(this.wingLeft, back?.['1a_back-accessories_left']?.pivot);
    if (this.wingRight) this.setPivot(this.wingRight, back?.['1b_back-accessories_right']?.pivot);
    this.backWings.addChild(...([this.wingLeft, this.wingRight].filter(Boolean) as Sprite[]));
    this.backWings.y = TUNING.wings.dropY; // turunkan sayap sedikit

    // --- rambut belakang (opsional per-piece) ---
    // Yang punya pivot dijadikan MESH (bisa dilengkungkan); yang tidak punya pivot
    // tetap sprite diam — mesh tanpa poros tak ada artinya.
    for (const key of ['2_back-hair', '3_lefthair_back', '4_righthair_back']) {
      const tex = this.textures.get(key);
      if (!tex) continue;
      const p = hair?.[key]?.pivot;
      if (p) {
        const hm = makeHairMesh(tex, p);
        hm.mesh.label = key;
        this.backHair.addChild(hm.mesh);
        this.hairPieces.push({ hair: hm, pivot: p });
      } else {
        const s = this.tryMake(key);
        if (s) this.backHair.addChild(s);
      }
    }

    const leftHand = this.tryMake('5_lefthand');
    const rightHand = this.tryMake('6_righthand');

    this.body = this.make('7_body');
    // Napas: skala vertikal halus dari dasar badan -> pivot bawah-tengah.
    this.body.pivot.set(CANVAS.width / 2, CANVAS.height);
    this.body.position.set(CANVAS.width / 2, CANVAS.height);

    // Aksesoris baju (pendulum), pivot di titik gantung — opsional.
    this.cloth = this.tryMake('7b_body_acessories');
    if (this.cloth) this.setPivot(this.cloth, manifest.groups.cloth_dynamic?.members['7b_body_acessories']?.pivot);

    // --- grup kepala ---
    const headbase = this.make('8_headbase');
    this.mouth = this.make('9b_mouth_closed');

    this.eyeBg = this.make('10_eyes_background');
    this.pupilL = this.make('10_eyes_pupil_left');
    this.pupilR = this.make('10_eyes_pupil_right');
    this.eyeFrame = this.make('10_eyes_frame');
    this.eyeVariant = new Sprite(); // tekstur di-set saat ganti state
    this.eyeVariant.visible = false;
    const blinkTex = this.textures.get(manifest.blink.overlay);
    this.eyeBlink = blinkTex ? new Sprite(blinkTex) : new Sprite(); // tanpa tekstur = tak tampil
    this.eyeBlink.visible = false;
    this.eyes.addChild(this.eyeBg, this.pupilL, this.pupilR, this.eyeFrame, this.eyeVariant, this.eyeBlink);

    const sideHair = this.tryMake('11_side_small_hair');

    this.bangs = this.tryMake('12_bangs');
    if (this.bangs) this.setPivot(this.bangs, hair?.['12_bangs']?.pivot);

    const browL = this.tryMake('13_left_eyebrow');
    const browR = this.tryMake('14_right_eyebrow');

    // Aksesoris kepala (z: 15a plume, lalu 15b statis) — opsional.
    this.headAccessory = this.tryMake('15a_head_accessories');
    if (this.headAccessory) {
      this.setPivot(this.headAccessory, manifest.groups.head_accessory_dynamic?.members['15a_head_accessories']?.pivot);
    }
    const headAccStatic = this.tryMake('15b_head_accessories');

    // Urutan z dipertahankan; yang null (tak ada di skin) di-skip.
    const headChildren = [
      headbase,
      this.mouth,
      this.eyes,
      sideHair,
      this.bangs,
      browL,
      browR,
      this.headAccessory,
      headAccStatic,
    ].filter(Boolean) as Container[];
    this.head.addChild(...headChildren);
    const hpv = manifest.groups.head_group.pivot;
    this.head.pivot.set(hpv[0], hpv[1]);
    this.head.position.set(hpv[0], hpv[1]);

    // Rambut belakang ikut turun bareng kepala (head di-drop via headTilt).
    this.backHair.y = TUNING.dropY;

    // --- rakit root sesuai z-order (bawah -> atas); yang null di-skip ---
    const rootChildren = [
      this.backWings,
      this.backHair,
      leftHand,
      rightHand,
      this.body,
      this.cloth,
      this.head,
    ].filter(Boolean) as Container[];
    this.root.addChild(...rootChildren);
    this.root.pivot.set(CANVAS.width / 2, CANVAS.height / 2);
  }
}
