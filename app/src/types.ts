// Bentuk manifest.json (hanya field yang dipakai renderer).
export type Vec2 = [number, number];

export interface StateDef {
  eyes: string; // "base" | key variant (closed_happy, shocked, angry, sad, dizzy, love, ...)
  mouth?: string; // key ke mouths (tunggal)
  mouths?: string[]; // atau kumpulan key -> dipilih acak tiap state di-apply (variasi)
  tracking: boolean;
  note?: string;
}

export interface EventDef {
  flash?: string; // state sekejap
  then?: string; // balik ke state ini setelah flash
  state?: string; // set state permanen
  on_error?: string;
  note?: string;
}

export interface Manifest {
  name: string;
  canvas: { width: number; height: number };
  z_order_idle: string[];
  groups: {
    head_group: { pivot: Vec2; members: string[]; note?: string };
    hair_dynamic: { note?: string; members: Record<string, { pivot: Vec2 }> };
    back_dynamic: { note?: string; members: Record<string, { pivot: Vec2 }> };
    cloth_dynamic: { note?: string; members: Record<string, { pivot: Vec2 }> };
    head_accessory_dynamic: { note?: string; members: Record<string, { pivot: Vec2 }> };
    static: { note?: string; members: string[] };
  };
  eyes: {
    base: string[];
    pupils: {
      left: { file: string; center: Vec2 };
      right: { file: string; center: Vec2 };
      max_offset: Vec2;
    };
    variants: Record<string, string>;
  };
  mouths: Record<string, string>;
  brows: { left: string; right: string; static: boolean };
  tracking: Record<string, unknown>;
  states: Record<string, StateDef>;
  blink: { overlay: string; only_when: string; interval_ms: Vec2; duration_ms: number };
  events: Record<string, EventDef>;
  bubble: Record<string, unknown>;
}
